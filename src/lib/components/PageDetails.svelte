<script lang="ts">
    import {createQuery} from "@tanstack/svelte-query";
    import {documentsApiGetPageOptions} from "$lib/api/@tanstack/svelte-query.gen";
    import DocumentPageViewer from "$lib/components/DocumentPageViewer.svelte";
    import {FileText} from "lucide-svelte";

    let { pageSqid = $bindable() } = $props()


    const pageQuery = $derived(createQuery({
        ...documentsApiGetPageOptions({
            path: {
                sqid: pageSqid,
            }
        }),
    }))
</script>

<!-- Page Content -->

<div class="flex-1 overflow-hidden">
    {#if $pageQuery.isSuccess}
        <DocumentPageViewer page={$pageQuery.data}  />
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