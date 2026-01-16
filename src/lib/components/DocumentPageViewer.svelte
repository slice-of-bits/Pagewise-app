<script lang="ts">
    import {PDFViewer} from 'sv-pdf';

    let {page} = $props();
</script>

<div class="h-full bg-white">
    <div class="max-w-4xl mx-auto p-8">
        {#if page.thumbnail_url}
            <!-- Page Thumbnail -->
            <div class="mb-6 text-center">
                <img
                        src={page.thumbnail_url}
                        alt="Page {page.page_number} thumbnail"
                        class="max-w-full h-auto border border-gray-200 rounded-lg shadow-sm"
                        style="max-height: 800px;"
                />
            </div>
        {/if}

        <!-- Page Content -->
        {#if page.page_pdf}
            <iframe src="{page.page_pdf}" class="w-full h-screen border border-gray-200 rounded-lg shadow-sm">
            </iframe>
        {:else}
            <div class="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
                <p class="text-gray-500">No text content available for this page</p>
                {#if page.status === 'processing'}
                    <p class="text-sm text-blue-600 mt-2">Page is still being processed...</p>
                {/if}
            </div>
        {/if}

        <!-- Page Metadata -->
        {#if page.metadata}
            <div class="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Page Information</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    {#if page.confidence_score !== undefined}
                        <div>
                            <span class="text-gray-500">OCR Confidence:</span>
                            <span class="ml-2 font-medium">{Math.round((page.confidence_score || 0) * 100)}%</span>
                        </div>
                    {/if}

                    {#if page.language}
                        <div>
                            <span class="text-gray-500">Language:</span>
                            <span class="ml-2 font-medium">{page.language}</span>
                        </div>
                    {/if}

                    {#if page.word_count}
                        <div>
                            <span class="text-gray-500">Word Count:</span>
                            <span class="ml-2 font-medium">{page.word_count}</span>
                        </div>
                    {/if}

                    {#if page.created_at}
                        <div>
                            <span class="text-gray-500">Processed:</span>
                            <span class="ml-2 font-medium">{new Date(page.created_at).toLocaleString()}</span>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Images on this page -->
        {#if page.images && page.images.length > 0}
            <div class="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Images ({page.images.length})</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {#each page.images as image (image.sqid)}
                        <div class="border border-gray-200 rounded overflow-hidden">
                            <img
                                    src={image.file_path}
                                    alt="Extracted image {image.image_number}"
                                    class="w-full h-24 object-cover"
                            />
                            <div class="p-2 text-xs text-gray-600">
                                Image {image.image_number}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

