<script lang="ts">
    import {
        FileText,
        Calendar,
        User,
        Eye,
        Download,
        MoreVertical,
        Clock,
        CheckCircle,
        AlertCircle
    } from 'lucide-svelte';
    import {goto} from '$app/navigation';


    let {document} = $props();

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
</script>

<div class="group relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer">
    <img src="{document.thumbnail}" class=""/>
    <div class="p-2">
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-2 min-w-0 flex-1">
                <h3 class="text-sm font-medium text-gray-900 truncate" title={document.title}>
                    {document.title}
                </h3>
            </div>

            <div class="flex items-center space-x-2">

                <!-- More Actions -->
                <button class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
                    <MoreVertical class="h-4 w-4 text-gray-400"/>
                </button>
            </div>
        </div>

        <!-- Metadata -->
        <div class="space-y-2 text-xs text-gray-500">
            {#if document.created_at}
                <div class="flex items-center space-x-1">
                    <Calendar class="h-3 w-3"/>
                    <span>Created {formatDate(document.created_at)}</span>
                </div>
            {/if}

            {#if document.page_count}
                <div class="flex items-center space-x-1">
                    <FileText class="h-3 w-3"/>
                    <span>{document.page_count} page{document.page_count !== 1 ? 's' : ''}</span>
                </div>
            {/if}
        </div>

        <!-- Processing Progress -->
        {#if document.processing_progress < 100 && document.processing_progress !== undefined}
            <div class="mt-3">
                <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Processing...</span>
                    <span>{Math.round(document.processing_progress)}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                            class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style="width: {document.processing_progress}%"
                    ></div>
                </div>
            </div>
        {/if}

        <!-- Actions -->
        <div class="mt-4 flex items-center justify-between">
            <button
                    onclick={() => goto(`/documents/${document.sqid}`)}
                    class="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
                View Document
            </button>

            <div class="flex items-center space-x-2">
                {#if document.status === 'completed'}
                    <button
                            onclick={() => goto(`/documents/${document.sqid}/pages`)}
                            class="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-xs"
                            title="Browse pages"
                    >
                        <Eye class="h-3 w-3"/>
                        <span>Pages</span>
                    </button>
                {/if}

                {#if document.file_path}
                    <!--					<button-->
                    <!--						onclick={() => window.open(`${API_BASE_URL}/api/documents/${document.sqid}/download`, '_blank')}-->
                    <!--						class="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-xs"-->
                    <!--						title="Download original"-->
                    <!--					>-->
                    <!--						<Download class="h-3 w-3" />-->
                    <!--					</button>-->
                {/if}
            </div>
        </div>
    </div>
</div>

