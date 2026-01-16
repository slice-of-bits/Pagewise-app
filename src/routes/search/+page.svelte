<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { Search, Filter, FileText, ChevronRight, ArrowLeft } from 'lucide-svelte';
	import SearchFilters from '$lib/components/SearchFilters.svelte';
	import SearchResultItem from '$lib/components/SearchResultItem.svelte';
	import { bucketApiListBuckets, documentsApiListDocuments, documentsApiSearchPages } from '$lib/api/sdk.gen';

	// Get search parameters
	let searchParams = $derived($page.url.searchParams);
	let query = $derived(searchParams.get('q') || '');
	let bucketFilter = $derived(searchParams.get('bucket_sqid') || '');
	let documentFilter = $derived(searchParams.get('document_sqid') || '');
	let isPreview = $derived(searchParams.get('preview') === 'true');
	let limit = $derived(parseInt(searchParams.get('limit') || '20'));
	let offset = $derived(parseInt(searchParams.get('offset') || '0'));

	let searchInput = $state(query);
	let showFilters = $state(false);

	// Search query
	const searchQuery = createQuery(() => ({
		queryKey: ['search', query, bucketFilter, documentFilter, limit, offset],
		queryFn: async () => {
			if (!query.trim()) return { results: [], total: 0 };

			const response = await documentsApiSearchPages({
				body: {
					q: query,
					bucket_sqid: bucketFilter || undefined,
					document_sqid: documentFilter || undefined,
					limit,
					offset
				}
			});

			return response.data || { results: [], total: 0 };
		},
		enabled: !!query.trim()
	}));

	// Buckets for filtering
	const bucketsQuery = createQuery(() => ({
		queryKey: ['buckets'],
		queryFn: async () => {
			const response = await bucketApiListBuckets();
			return response.data || [];
		}
	}));

	// Documents for filtering
	const documentsQuery = createQuery(() => ({
		queryKey: ['documents'],
		queryFn: async () => {
			const response = await documentsApiListDocuments();
			return response.data || [];
		}
	}));

	function handleSearch() {
		event?.preventDefault();
		const params = new URLSearchParams();
		if (searchInput.trim()) params.set('q', searchInput.trim());
		if (bucketFilter) params.set('bucket_sqid', bucketFilter);
		if (documentFilter) params.set('document_sqid', documentFilter);
		params.set('limit', limit.toString());
		params.set('offset', '0');

		goto(`/search?${params.toString()}`);
	}

	function updateFilters(filters: { bucketFilter?: string; documentFilter?: string; limit?: number }) {
		const params = new URLSearchParams();
		if (query) params.set('q', query);
		if (filters.bucketFilter) params.set('bucket_sqid', filters.bucketFilter);
		if (filters.documentFilter) params.set('document_sqid', filters.documentFilter);
		params.set('limit', (filters.limit || limit).toString());
		params.set('offset', '0');

		goto(`/search?${params.toString()}`);
	}

	function loadMore() {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('offset', (offset + limit).toString());
		goto(`/search?${params.toString()}`);
	}

	function goToPage(document_sqid: string, page_number: number) {
		goto(`/documents/${document_sqid}/pages/${page_number}`);
	}

	let totalPages = $derived(searchQuery.data && (searchQuery.data as any).total ? Math.ceil((searchQuery.data as any).total / limit) : 0);
	let currentPage = $derived(Math.floor(offset / limit) + 1);
	let hasResults = $derived(searchQuery.data && (searchQuery.data as any).results && (searchQuery.data as any).results.length > 0);

	// Initialize searchInput when query changes
	$effect(() => {
		searchInput = query;
	});
</script>

<svelte:head>
	<title>Search Results - Pagewise</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			{#if isPreview}
				<button
					onclick={() => history.back()}
					class="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
				>
					<ArrowLeft class="h-4 w-4" />
					<span>Back</span>
				</button>
			{/if}
			<h1 class="text-2xl font-bold text-gray-900">Search Results</h1>
		</div>

		<button
			onclick={() => showFilters = !showFilters}
			class="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
		>
			<Filter class="h-4 w-4" />
			<span>Filters</span>
		</button>
	</div>

	<!-- Search Bar -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<form onsubmit={handleSearch} class="space-y-4">
			<div class="flex space-x-4">
				<div class="flex-1">
					<div class="relative">
						<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
							<Search class="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="text"
							bind:value={searchInput}
							placeholder="Search documents and pages..."
							class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg"
						/>
					</div>
				</div>
				<button
					type="submit"
					class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
				>
					Search
				</button>
			</div>

			{#if query}
				<div class="text-sm text-gray-600">
					Searching for: <strong>"{query}"</strong>
					{#if bucketFilter || documentFilter}
						with filters applied
					{/if}
				</div>
			{/if}
		</form>
	</div>

	<!-- Filters -->
	{#if showFilters}
		<SearchFilters
			bind:bucketFilter
			bind:documentFilter
			bind:limit
			buckets={(bucketsQuery.data as any[]) || []}
			documents={(documentsQuery.data as any[]) || []}
			onUpdate={updateFilters}
		/>
	{/if}

	<!-- Results -->
	{#if query}
		{#if searchQuery.isLoading}
			<div class="text-center py-12">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p class="mt-4 text-gray-600">Searching...</p>
			</div>
		{:else if searchQuery.error}
			<div class="text-center py-12">
				<p class="text-red-600">Error performing search. Please try again.</p>
			</div>
		{:else if !hasResults}
			<div class="text-center py-12">
				<Search class="mx-auto h-12 w-12 text-gray-300" />
				<h3 class="mt-4 text-lg font-medium text-gray-900">No results found</h3>
				<p class="mt-2 text-gray-500">
					Try adjusting your search terms or removing filters.
				</p>
			</div>
		{:else}
			<div class="bg-white rounded-lg border border-gray-200">
				<!-- Results Header -->
				<div class="border-b border-gray-200 px-6 py-4">
					<div class="flex items-center justify-between">
						<p class="text-sm text-gray-600">
							{searchQuery.data && (searchQuery.data as any).total ? (searchQuery.data as any).total : 0} result{(searchQuery.data && (searchQuery.data as any).total !== 1) ? 's' : ''} found
						</p>
						<p class="text-sm text-gray-600">
							Page {currentPage} of {totalPages}
						</p>
					</div>
				</div>

				<!-- Results List -->
				<div class="divide-y divide-gray-200">
					{#each (searchQuery.data && (searchQuery.data as any).results) || [] as result, index (result.page_sqid || index)}
						<SearchResultItem
							{result}
							{query}
							onClick={() => goToPage(result.document_sqid, result.page_number)}
						/>
					{/each}
				</div>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="border-t border-gray-200 px-6 py-4">
						<div class="flex items-center justify-between">
							<button
								onclick={() => {
									const params = new URLSearchParams($page.url.searchParams);
									params.set('offset', Math.max(0, offset - limit).toString());
									goto(`/search?${params.toString()}`);
								}}
								disabled={offset === 0}
								class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Previous
							</button>

							<span class="text-sm text-gray-700">
								Showing {offset + 1} to {Math.min(offset + limit, (searchQuery.data && (searchQuery.data as any).total) || 0)} of {(searchQuery.data && (searchQuery.data as any).total) || 0} results
							</span>

							<button
								onclick={() => {
									const params = new URLSearchParams($page.url.searchParams);
									params.set('offset', (offset + limit).toString());
									goto(`/search?${params.toString()}`);
								}}
								disabled={offset + limit >= ((searchQuery.data && (searchQuery.data as any).total) || 0)}
								class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Next
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	{:else}
		<div class="text-center py-12">
			<Search class="mx-auto h-12 w-12 text-gray-300" />
			<h3 class="mt-4 text-lg font-medium text-gray-900">Start searching</h3>
			<p class="mt-2 text-gray-500">
				Enter a search term above to find documents and pages.
			</p>
		</div>
	{/if}
</div>

