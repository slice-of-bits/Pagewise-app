<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
    import type { PageProps } from './$types';
    import {documentsApiGetDocumentOptions} from "$lib/api/@tanstack/svelte-query.gen";
    import PageDetails from "$lib/components/PageDetails.svelte";
    import DocumentNavBar from "$lib/components/documents/DocumentNavBar.svelte";

    let { params }: PageProps = $props();

	let showSidebar = $state(false);
	let currentPageNumber = $state(1);
	let hasInitialized = $state(false);
	let lastDocumentSqid = $state('');

	// Reset initialization when navigating to a different document
	$effect(() => {
		if (params.sqid !== lastDocumentSqid) {
			hasInitialized = false;
			lastDocumentSqid = params.sqid;
		}
	});

	// Initialize page number from URL parameter only once per document
	$effect(() => {
		if (!hasInitialized) {
			const pageParam = $page.url.searchParams.get('page');
			const initialPageNumber = pageParam ? parseInt(pageParam) : 1;
			if (initialPageNumber >= 1) {
				currentPageNumber = initialPageNumber;
			}
			hasInitialized = true;
		}
	});

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

	// Function to change page from the editor
	function handlePageChange(newPageNumber: number) {
		if (newPageNumber >= 1 && newPageNumber <= ($documentQuery.data?.page_count || 0)) {
			currentPageNumber = newPageNumber;
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
            <DocumentNavBar {documentQuery} bind:currentPageNumber />
			<!-- Page Navigation -->
			{#if $documentQuery.data && ($documentQuery.data?.page_count || 0) > 1}
                <PageDetails
					bind:pageSqid={currentPageSqid}
					documentSqid={params.sqid}
					currentPageNumber={currentPageNumber}
					totalPages={$documentQuery.data.page_count || 0}
					onPageChange={handlePageChange}
				/>
            {/if}
		</div>
	</div>
{/if}
