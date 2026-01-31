<script lang="ts">
    import {ChevronLeft, ChevronRight, Download, Edit, Eye} from "lucide-svelte";

    let {
        documentQuery,
        currentPageNumber = $bindable(1),
        showEditor = $bindable(false),
    } = $props();

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
<!-- Header -->
<div class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
            <button
                    onclick={() => history.back()}
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Go back"
            >
                <ChevronLeft class="h-5 w-5 text-gray-600"/>
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
            <div class="flex items-center space-x-2">

                {#if $documentQuery.data.original_pdf}
                    <button
                            onclick={() => window.open($documentQuery.data.original_pdf, '_blank')}
                            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download original"
                    >
                        <Download class="h-5 w-5 text-gray-600"/>
                    </button>
                {/if}

                <button
                        onclick={() => showEditor = !showEditor}
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium"
                >
                    {#if showEditor}
                        <Eye class="h-4 w-4"/>
                        <span>View Mode</span>
                    {:else}
                        <Edit class="h-4 w-4"/>
                        <span>Edit Docling Data</span>
                    {/if}
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
                <ChevronLeft class="h-4 w-4"/>
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
                <ChevronRight class="h-4 w-4"/>
            </button>
        </div>
    </div>

{/if}

