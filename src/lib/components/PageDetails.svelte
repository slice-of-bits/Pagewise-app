<script lang="ts">
    import {createQuery} from "@tanstack/svelte-query";
    import {documentsApiGetPageOptions} from "$lib/api/@tanstack/svelte-query.gen";
    import DocumentPageViewer from "$lib/components/DocumentPageViewer.svelte";
    import {FileText, Edit} from "lucide-svelte";
    import DocumentMarkDownViewer from "$lib/components/documents/DocumentMarkDownViewer.svelte";
    import DoclingPageEditor from "$lib/components/docling/DoclingPageEditor.svelte";

    let { pageSqid = $bindable() } = $props()

    let showEditor = $state(false);

    const pageQuery = $derived(createQuery({
        ...documentsApiGetPageOptions({
            path: {
                sqid: pageSqid,
            }
        }),
    }))
</script>

<!-- Page Content -->

{#if showEditor && pageSqid}
    <DoclingPageEditor
        {pageSqid}
        {documentSqid}
        {currentPageNumber}
        {totalPages}
        {onPageChange}
        onClose={() => showEditor = false}
    />
{:else}
    <div class="flex-1 overflow-auto">
        {#if $pageQuery.isSuccess}
            <!-- Edit Button -->
            <div class="flex justify-end p-4 bg-white border-b border-gray-200">
                <button
                    onclick={() => showEditor = true}
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 text-sm font-medium"
                >
                    <Edit class="h-4 w-4" />
                    <span>Edit Docling Data</span>
                </button>
            </div>

            <div class="grid grid-cols-6">
    <!--            <div class="col-span-2">-->
    <!--                <DocumentMarkDownViewer content={$pageQuery.data.ocr_markdown_raw} />-->
    <!--            </div>-->
                <div class="col-span-4">
                    <DocumentPageViewer page={$pageQuery.data}  />
                </div>
                <div class="col-span-2">
                    <DocumentMarkDownViewer content={$pageQuery.data.text_markdown_clean} />
                </div>
            </div>
        {:else}
            <div class="flex items-center justify-center h-full text-gray-500">
                {#if $pageQuery.isLoading}
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p class="mt-4">Loading pages...</p>
                    </div>
                {:else}
                    <div class="text-center">
                        <FileText class="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No pages available</p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}
