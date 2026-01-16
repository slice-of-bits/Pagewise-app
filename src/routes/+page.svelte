<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import {Folder, FileText, Plus, Upload, Clock, CheckCircle} from 'lucide-svelte';
    import DocumentCard from '$lib/components/DocumentCard.svelte';
    import {bucketApiListBuckets, documentsApiListDocuments} from '$lib/api/sdk.gen';
    import {bucketApiListBucketsOptions, documentsApiListDocumentsOptions} from "$lib/api/@tanstack/svelte-query.gen";

    // Fetch all buckets
    const bucketsQuery = createQuery({
        ...bucketApiListBucketsOptions()
    });

    // Fetch all documents
    const documentsQuery = createQuery({
        ...documentsApiListDocumentsOptions()
    });
</script>

<svelte:head>
    <title>Pagewise - Document Management</title>
    <meta name="description" content="Manage your scanned documents with page-level search capabilities"/>
</svelte:head>

<div class="space-y-8">
    <!-- Hero Section -->
    <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to <span class="text-blue-600">Pagewise</span>
        </h1>
        <p class="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
            Organize, search, and manage your scanned documents with intelligent page-level search capabilities.
        </p>
        <div class="mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8">
            <div class="rounded-md shadow">
                <a
                        href="/upload"
                        class="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 md:py-4 md:px-10 md:text-lg"
                >
                    <Upload class="mr-2 h-5 w-5"/>
                    Upload Document
                </a>
            </div>
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
                            {#if $documentsQuery.data}
                                { $documentsQuery.data.count }
                            {:else}
                                0
                            {/if}
                        </dd>
                    </dl>
                </div>
            </div>
        </div>

        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <Clock class="h-8 w-8 text-yellow-400"/>
                </div>
                <div class="ml-5 w-0 flex-1">
                    <dl>
                        <dt class="text-sm font-medium text-gray-500 truncate">Processing</dt>
                        <dd class="text-lg font-medium text-gray-900">

                        </dd>
                    </dl>
                </div>
            </div>
        </div>

        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <CheckCircle class="h-8 w-8 text-green-400"/>
                </div>
                <div class="ml-5 w-0 flex-1">
                    <dl>
                        <dt class="text-sm font-medium text-gray-500 truncate">Completed</dt>
                        <dd class="text-lg font-medium text-gray-900">

                        </dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading States -->
    {#if $documentsQuery.isLoading}
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">Loading documents...</p>
        </div>
    {:else if $documentsQuery.error}
        <div class="text-center py-12">
            <p class="text-red-600">Error loading documents. Please try again.</p>
        </div>
    {:else if $documentsQuery.isSuccess}
        {#if $documentsQuery.data.count == 0}
            <!-- Empty State -->
            <div class="text-center py-12">
                <Folder class="mx-auto h-24 w-24 text-gray-300"/>
                <h3 class="mt-4 text-lg font-medium text-gray-900">No documents yet</h3>
                <p class="mt-2 text-gray-500">Get started by uploading your first document.</p>
                <div class="mt-6">
                    <a
                            href="/upload"
                            class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                    >
                        <Plus class="mr-2 h-4 w-4"/>
                        Upload Document
                    </a>
                </div>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each $documentsQuery.data.items as document (document.sqid)}
                    <DocumentCard {document}/>
                {/each}
            </div>
        {/if}
    {/if}
</div>


