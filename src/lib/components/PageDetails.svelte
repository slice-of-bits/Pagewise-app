<script lang="ts">
    import {createQuery} from "@tanstack/svelte-query";
    import {documentsApiGetPageOptions} from "$lib/api/@tanstack/svelte-query.gen";
    import DocumentPageViewer from "$lib/components/documents/DocumentPageViewer.svelte";
    import {FileText} from "lucide-svelte";
    import DocumentMarkDownViewer from "$lib/components/documents/DocumentMarkDownViewer.svelte";
    import DoclingPageEditor from "$lib/components/docling/DoclingPageEditor.svelte";

    let {
        pageSqid = $bindable(),
        showEditor = $bindable(false)
    } = $props()

    const pageQuery = $derived(createQuery({
        ...documentsApiGetPageOptions({
            path: {
                sqid: pageSqid,
            }
        }),
    }))
</script>

<!-- Page Content -->


<div class="flex-1 overflow-auto">
    {#if $pageQuery.isSuccess}

        {#if showEditor}
            <!-- Full-screen Docling Editor -->
            <DoclingPageEditor
                    page={$pageQuery.data}
                    onClose={() => showEditor = false}
            />
        {:else}
            <div class="grid grid-cols-12 gap-4 p-4">
                <div class="col-span-6">
                    <DocumentPageViewer page={$pageQuery.data}/>
                </div>
                <div class="col-span-6">
                    <DocumentMarkDownViewer content={$pageQuery.data.text_markdown_clean}/>
                </div>
            </div>
        {/if}


    {:else}
        <div class="flex items-center justify-center h-full text-gray-500">
            {#if $pageQuery.isLoading}
                <div class="text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p class="mt-4">Loading pages...</p>
                </div>
            {:else}
                <div class="text-center">
                    <FileText class="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                    <p>No pages available</p>
                </div>
            {/if}
        </div>
    {/if}
</div>

