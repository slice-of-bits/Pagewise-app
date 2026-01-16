<script lang="ts">
    import { FileText, ChevronDown, ChevronRight } from 'lucide-svelte';
    import SearchResultPageItem from "$lib/components/search/SearchResultPageItem.svelte";

    let { resultDocument, query } = $props();
    let isExpanded = $state(true); // Start expanded to show pages by default

    function toggleExpanded() {
        isExpanded = !isExpanded;
    }
</script>

<div class="border-b border-gray-200 last:border-b-0">
    <!-- Document Header -->
    <button
        class="w-full p-6 hover:bg-gray-50 transition-colors cursor-pointer text-left border-0 bg-transparent"
        onclick={toggleExpanded}
        type="button"
    >
        <div class="flex items-start space-x-4">
            <!-- Document Thumbnail -->
            <div class="flex-shrink-0">
                {#if resultDocument.thumbnail}
                    <img
                        src={resultDocument.thumbnail}
                        alt={resultDocument.title}
                        class="h-12 w-12 object-cover rounded border"
                    />
                {:else}
                    <FileText class="h-12 w-12 text-gray-400 p-2 border rounded" />
                {/if}
            </div>

            <div class="flex-1 min-w-0">
                <!-- Document Title and Info -->
                <div class="flex items-center space-x-2 mb-2">
                    <h3 class="text-lg font-medium text-gray-900 truncate">
                        {resultDocument.title}
                    </h3>
                    <span class="text-gray-400">•</span>
                    <span class="text-sm text-gray-600">
                        {resultDocument.pages.length} page{resultDocument.pages.length !== 1 ? 's' : ''} found
                    </span>
                </div>

                <!-- Document Metadata -->
                <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {resultDocument.sqid}
                    </span>
                </div>
            </div>

            <!-- Expand/Collapse Icon -->
            <div class="flex-shrink-0">
                {#if isExpanded}
                    <ChevronDown class="h-5 w-5 text-gray-400" />
                {:else}
                    <ChevronRight class="h-5 w-5 text-gray-400" />
                {/if}
            </div>
        </div>
    </button>

    <!-- Pages List -->
    {#if isExpanded && resultDocument.pages?.length > 0}
        <div class="pb-4">
            {#each resultDocument.pages as page}
                <SearchResultPageItem {page} {query} documentSqid={resultDocument.sqid} />
            {/each}
        </div>
    {/if}
</div>

