<script lang="ts">
	import { createQuery, createMutation } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { Download, Edit, ChevronLeft, ChevronRight } from 'lucide-svelte';
    import type { PageProps } from './$types';
    import {documentsApiGetDocumentOptions, documentsApiGetPageOptions} from "$lib/api/@tanstack/svelte-query.gen";
    import PageDetails from "$lib/components/PageDetails.svelte";

    let { params }: PageProps = $props();

	let showSidebar = $state(false);
	let currentPageNumber = $state(1);


	// Fetch document details
	const documentQuery = createQuery({
       ...documentsApiGetDocumentOptions({
           path: {
               sqid: params.sqid
           }
       })
    });

    let currentPageSqid = $derived.by(() => {
        if (!$documentQuery.data) return null;
        const page = $documentQuery.data.pages?.find(p => p.page_number === currentPageNumber);
        return page ? page.sqid : null;
    });

	function nextPage() {
		const totalPages = $documentQuery.data?.page_count || 0;
		if (currentPageNumber < totalPages) {
			currentPageNumber += 1;
		}
	}

	function previousPage() {
		if (currentPageNumber > 1) {
			currentPageNumber -= 1;
		}
	}

	function goToPage(pageNumber: number) {
		const totalPages = $documentQuery.data?.page_count || 0;
		if (pageNumber >= 1 && pageNumber <= totalPages) {
			currentPageNumber = pageNumber;
		}
	}

</script>

<svelte:head>
	<title>{$documentQuery.data?.title || 'Document'} - Pagewise</title>
</svelte:head>

{#if $documentQuery.isLoading}
	<div class="flex items-center justify-center h-64">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
	</div>
{:else if $documentQuery.isError}
	<div class="text-center py-12">
		<p class="text-red-600">Error loading document. Please try again.</p>
        {$documentQuery.error}
		<button
			onclick={() => goto('/')}
			class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
		>
			Go Back
		</button>
	</div>
{:else if $documentQuery.isSuccess && $documentQuery.data}
	<div class="flex h-screen bg-gray-50">
		<!-- Main Content -->
		<div class="flex-1 flex flex-col">
			<!-- Header -->
			<div class="bg-white border-b border-gray-200 px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<button
							onclick={() => history.back()}
							class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
							title="Go back"
						>
							<ChevronLeft class="h-5 w-5 text-gray-600" />
						</button>

						<div>
							<h1 class="text-xl font-semibold text-gray-900">{$documentQuery.data.title}</h1>
							<div class="flex items-center space-x-4 text-sm text-gray-600 mt-1">
								<span>{$documentQuery.data.page_count} pages</span>
								<span>•</span>
								<span>Created {new Date($documentQuery.data.created_at).toLocaleDateString()}</span>
								{#if $documentQuery.data.processing_progress < 100}
									<span>•</span>
									<span class="capitalize">Processing</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="flex items-center space-x-3">
						<!-- Search Toggle -->
<!--						<DocumentSearchBar-->
<!--							bind:searchQuery-->
<!--							searchResults={$documentSearchMutation.data || []}-->
<!--							isLoading={$documentSearchMutation.isPending}-->
<!--							onResultClick={handleSearchResult}-->
<!--						/>-->

						<!-- Sidebar Toggle -->
						<button
							onclick={() => showSidebar = !showSidebar}
							class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
							class:bg-blue-50={showSidebar}
							class:border-blue-300={showSidebar}
							class:text-blue-700={showSidebar}
						>
							Edit OCR
						</button>

						<!-- Actions -->
						<div class="flex items-center space-x-2">
							{#if $documentQuery.data.original_pdf}
								<button
									onclick={() => window.open($documentQuery.data.original_pdf, '_blank')}
									class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
									title="Download original"
								>
									<Download class="h-5 w-5 text-gray-600" />
								</button>
							{/if}

							<button
								class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
								title="Edit document"
							>
								<Edit class="h-5 w-5 text-gray-600" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Page Navigation -->
			{#if $documentQuery.data && ($documentQuery.data?.page_count || 0) > 1}
				<div class="bg-white border-b border-gray-200 px-6 py-3">
					<div class="flex items-center justify-between">
						<button
							onclick={previousPage}
							disabled={currentPageNumber === 1}
							class="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
						>
							<ChevronLeft class="h-4 w-4" />
							<span>Previous</span>
						</button>

						<div class="flex items-center space-x-4">
							<span class="text-sm text-gray-600">
								Page {currentPageNumber} of {$documentQuery.data.page_count}
							</span>

							<div class="flex items-center space-x-2">
								<label for="page-input" class="text-sm text-gray-600">Go to:</label>
								<input
									id="page-input"
									type="number"
									min="1"
									max={$documentQuery.data.page_count}
									value={currentPageNumber}
									oninput={(e) => goToPage(parseInt(e.currentTarget.value))}
									class="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
								/>
							</div>
						</div>

						<button
							onclick={nextPage}
							disabled={currentPageNumber === $documentQuery.data.page_count}
							class="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
						>
							<span>Next</span>
							<ChevronRight class="h-4 w-4" />
						</button>
					</div>
				</div>

                <PageDetails bind:pageSqid={currentPageSqid} />

            {/if}


		</div>

		<!-- Sidebar for OCR Editing -->
		<!--{#if showSidebar && currentPage}-->
		<!--	<DocumentSidebar-->
		<!--		page={currentPage}-->
		<!--		onClose={() => showSidebar = false}-->
		<!--		onUpdate={() => {-->
		<!--			// Refresh the pages data after update-->
		<!--			$pagesQuery.refetch();-->
		<!--		}}-->
		<!--	/>-->
		<!--{/if}-->
	</div>
{/if}
