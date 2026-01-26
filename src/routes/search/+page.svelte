<script lang="ts">
    import {page} from '$app/stores';
    import {goto} from '$app/navigation';
    import {createQuery} from '@tanstack/svelte-query';
    import {Search, Filter, ArrowLeft} from 'lucide-svelte';
    // import SearchFilters from '$lib/components/SearchFilters.svelte';
    import {
        pondsApiListPondsOptions,
        documentsApiListDocumentsOptions,
        documentsApiSearchPagesOptions
    } from "$lib/api/@tanstack/svelte-query.gen";
    import SearchResultDocumentItem from "$lib/components/search/SearchResultDocumentItem.svelte";

    // Get search parameters
    let searchParams = $derived($page.url.searchParams);
    let query = $derived(searchParams.get('q') || 'zeilen');
    let bucketFilter = $derived(searchParams.get('bucket_sqid') || '');
    let documentFilter = $derived(searchParams.get('document_sqid') || '');
    let isPreview = $derived(searchParams.get('preview') === 'true');
    let limit = $derived(parseInt(searchParams.get('limit') || '20'));
    let offset = $derived(parseInt(searchParams.get('offset') || '0'));

    let searchInput = $state('zeilen');
    let showFilters = $state(false);

    // Search query
    const searchQuery = $derived(createQuery({
        ...documentsApiSearchPagesOptions(
            {
                query:
                    {q: query}
            }
        )
    }));

    // Buckets for filtering
    const bucketsQuery = createQuery({
        ...groupsApiListGroupsOptions()
    });

    // Documents for filtering - use search API instead of list
    const documentsQuery = createQuery({
        ...documentsApiSearchPagesOptions(
            {
                query: {q: ''}  // Empty query to get all documents for filtering
            }
        )
    });

    // Search function
    function handleSearch(event?: Event) {
        const params = new URLSearchParams($page.url.searchParams);
        params.set('q', searchInput);
        goto(`/search?${params.toString()}`);
    }

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
                    <ArrowLeft class="h-4 w-4"/>
                    <span>Back</span>
                </button>
            {/if}
            <h1 class="text-2xl font-bold text-gray-900">Search Results</h1>
        </div>

        <button
                onclick={() => showFilters = !showFilters}
                class="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
            <Filter class="h-4 w-4"/>
            <span>Filters</span>
        </button>
    </div>

    <!-- Search Bar -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
        <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); handleSearch(e); }}>
            <div class="flex space-x-4">
                <div class="flex-1">
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search class="h-5 w-5 text-gray-400"/>
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
    <!-- Filters are disabled for now -->

    <!-- Results -->
    {#if query}
        {#if $searchQuery.isLoading}
            <div class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p class="mt-4 text-gray-600">Searching...</p>
            </div>
        {:else if $searchQuery.error}
            <div class="text-center py-12">
                <p class="text-red-600">Error performing search. Please try again.</p>
            </div>
        {:else if $searchQuery.isSuccess && (!$searchQuery.data.documents || $searchQuery.data.documents.length === 0)}
            <div class="text-center py-12">
                <Search class="mx-auto h-12 w-12 text-gray-300"/>
                <h3 class="mt-4 text-lg font-medium text-gray-900">No results found</h3>
                <p class="mt-2 text-gray-500">
                    Try adjusting your search terms or removing filters.
                </p>
            </div>
        {:else if $searchQuery.isSuccess && $searchQuery.data.documents && $searchQuery.data.documents.length > 0}
            <div class="bg-white rounded-lg border border-gray-200">
                <!-- Results Header -->
                <div class="border-b border-gray-200 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-gray-600">
                            {$searchQuery.data.documents.length} document{$searchQuery.data.documents.length !== 1 ? 's' : ''} found
                            • {$searchQuery.data.documents.reduce((total, doc) => total + doc.pages.length, 0)} page{$searchQuery.data.documents.reduce((total, doc) => total + doc.pages.length, 0) !== 1 ? 's' : ''}
                        </p>
<!--                        <p class="text-sm text-gray-600">-->
<!--                            Page {currentPage} of {totalPages}-->
<!--                        </p>-->
                    </div>
                </div>

                <!-- Results List -->
                <div class="divide-y divide-gray-200">
                    {#each $searchQuery.data.documents as resultDocument}
                        <SearchResultDocumentItem
                                resultDocument={resultDocument}
                                {query}
                        />
                    {/each}
                </div>

                <!-- Pagination -->
                <!--{#if totalPages > 1}-->
                <!--    <div class="border-t border-gray-200 px-6 py-4">-->
                <!--        <div class="flex items-center justify-between">-->
                <!--            <button-->
                <!--                    onclick={() => {-->
				<!--					const params = new URLSearchParams($page.url.searchParams);-->
				<!--					params.set('offset', Math.max(0, offset - limit).toString());-->
				<!--					goto(`/search?${params.toString()}`);-->
				<!--				}}-->
                <!--                    disabled={offset === 0}-->
                <!--                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"-->
                <!--            >-->
                <!--                Previous-->
                <!--            </button>-->

                <!--            <span class="text-sm text-gray-700">-->
				<!--				Showing {offset + 1}-->
                <!--                to {Math.min(offset + limit, (searchQuery.data && (searchQuery.data as any).total) || 0)}-->
                <!--                of {(searchQuery.data && (searchQuery.data as any).total) || 0} results-->
				<!--			</span>-->

                <!--            <button-->
                <!--                    onclick={() => {-->
				<!--					const params = new URLSearchParams($page.url.searchParams);-->
				<!--					params.set('offset', (offset + limit).toString());-->
				<!--					goto(`/search?${params.toString()}`);-->
				<!--				}}-->
                <!--                    disabled={offset + limit >= ((searchQuery.data && (searchQuery.data as any).total) || 0)}-->
                <!--                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"-->
                <!--            >-->
                <!--                Next-->
                <!--            </button>-->
                <!--        </div>-->
                <!--    </div>-->
                <!--{/if}-->
            </div>
        {/if}
    {:else}
        <div class="text-center py-12">
            <Search class="mx-auto h-12 w-12 text-gray-300"/>
            <h3 class="mt-4 text-lg font-medium text-gray-900">Start searching</h3>
            <p class="mt-2 text-gray-500">
                Enter a search term above to find documents and pages.
            </p>
        </div>
    {/if}
</div>

