<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import {FileText, Search, Filter, Calendar, User, Eye, Download} from 'lucide-svelte';
    import {documentsApiListDocuments, bucketApiListBuckets} from '$lib/api/sdk.gen';
    import {page} from '$app/stores';
    import {goto} from '$app/navigation';
    import DocumentCard from '$lib/components/DocumentCard.svelte';
    import {documentsApiListDocumentsOptions} from "$lib/api/@tanstack/svelte-query.gen";

    // Get query parameters
    let searchParams = $derived($page.url.searchParams);
    let bucketFilter = $derived(searchParams.get('bucket') || '');
    let searchFilter = $derived(searchParams.get('search') || '');

    // Fetch all documents
    const documentsQuery = createQuery({
        ...documentsApiListDocumentsOptions({
            query: {
                limit: 50,
                offset: 0,
            }
        })
    });

    // Fetch buckets for filtering
    const bucketsQuery = createQuery({
        ...bucketApiListBuckets()
    });

    let searchInput = $state(searchFilter);
    let selectedBucket = $state(bucketFilter);

    function handleSearch() {
        const params = new URLSearchParams();
        if (selectedBucket) params.set('bucket', selectedBucket);
        if (searchInput.trim()) params.set('search', searchInput.trim());

        const queryString = params.toString();
        goto(`/documents${queryString ? '?' + queryString : ''}`);
    }

    function clearFilters() {
        selectedBucket = '';
        searchInput = '';
        goto('/documents');
    }

    let selectedBucketData = $derived(
        selectedBucket ? (bucketsQuery.data as any[])?.find((b: any) => b.sqid === selectedBucket) : null
    );
</script>

<svelte:head>
    <title>Documents - Pagewise</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Documents</h1>
            {#if selectedBucketData}
                <p class="mt-1 text-sm text-gray-600">
                    Documents in "{selectedBucketData.name}"
                </p>
            {:else}
                <p class="mt-1 text-sm text-gray-600">
                    All documents in your library
                </p>
            {/if}
        </div>

        <a
                href="/upload"
                class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
            <FileText class="mr-2 h-4 w-4"/>
            Upload Document
        </a>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center space-x-4">
            <div class="flex-1">
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search class="h-5 w-5 text-gray-400"/>
                    </div>
                    <input
                            type="text"
                            bind:value={searchInput}
                            placeholder="Search documents..."
                            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div class="w-48">
                <select
                        bind:value={selectedBucket}
                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">All Buckets</option>
                    {#each (bucketsQuery.data as any[]) || [] as bucket (bucket.sqid)}
                        <option value={bucket.sqid}>{bucket.name}</option>
                    {/each}
                </select>
            </div>

            <button
                    onclick={handleSearch}
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Search
            </button>

            {#if selectedBucket || searchInput}
                <button
                        onclick={clearFilters}
                        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Clear
                </button>
            {/if}
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <FileText class="h-8 w-8 text-gray-400"/>
                </div>
                <div class="ml-5 w-0 flex-1">
                    <dl>
                        <dt class="text-sm font-medium text-gray-500 truncate">Total Documents</dt>
                        <dd class="text-lg font-medium text-gray-900">
                            {#if $documentsQuery.isLoading}
                                ...
                            {:else if $documentsQuery.isSuccess}
                                {$documentsQuery.data.count}
                            {:else if $documentsQuery.isError}
                                Error
                            {/if}
                        </dd>
                    </dl>
                </div>
            </div>
        </div>

        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
                <div class="ml-5 w-0 flex-1">
                    <dl>
                        <dt class="text-sm font-medium text-gray-500 truncate">Processing</dt>
                        <dd class="text-lg font-medium text-gray-900">
                            {#if $documentsQuery.isLoading}
                                ...
                            {:else if $documentsQuery.isSuccess}
                                {$documentsQuery.data.count}
                            {:else if $documentsQuery.isError}
                                Error
                            {/if}
                        </dd>
                    </dl>
                </div>
            </div>
        </div>

        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <div class="h-4 w-4 rounded-full bg-green-500"></div>
                    </div>
                </div>
                <div class="ml-5 w-0 flex-1">
                    <dl>
                        <dt class="text-sm font-medium text-gray-500 truncate">Completed</dt>
                        <dd class="text-lg font-medium text-gray-900">
                            {#if $documentsQuery.isLoading}
                                ...
                            {:else if $documentsQuery.isSuccess}
                                {$documentsQuery.data.count}
                            {:else if $documentsQuery.isError}
                                Error
                            {/if}
                        </dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>

    <!-- Documents Grid -->
    {#if $documentsQuery.isLoading}
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">Loading documents...</p>
        </div>
    {:else if $documentsQuery.error}
        <div class="text-center py-12">
            <p class="text-red-600">Error loading documents. Please try again.</p>
        </div>
    {:else if $documentsQuery.isSuccess}
        {#if $documentsQuery.data.count === 0}
            <!-- Empty State -->
            <div class="text-center py-12">
                {#if selectedBucket || searchFilter}
                    <Search class="mx-auto h-24 w-24 text-gray-300"/>
                    <h3 class="mt-4 text-lg font-medium text-gray-900">No documents found</h3>
                    <p class="mt-2 text-gray-500">
                        Try adjusting your search terms or filters.
                    </p>
                    <div class="mt-6">
                        <button
                                onclick={clearFilters}
                                class="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700"
                        >
                            Clear Filters
                        </button>
                    </div>
                {:else}
                    <FileText class="mx-auto h-24 w-24 text-gray-300"/>
                    <h3 class="mt-4 text-lg font-medium text-gray-900">No documents yet</h3>
                    <p class="mt-2 text-gray-500">
                        Get started by uploading your first document.
                    </p>
                    <div class="mt-6">
                        <a
                                href="/upload"
                                class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                        >
                            <FileText class="mr-2 h-4 w-4"/>
                            Upload Document
                        </a>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each $documentsQuery.data.items as document (document.sqid)}
                    <DocumentCard {document}/>
                {/each}
            </div>
        {/if}
    {/if}

</div>
