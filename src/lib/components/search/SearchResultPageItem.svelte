<script lang="ts">
    import { FileText, ArrowRight } from 'lucide-svelte';
    import { goto } from '$app/navigation';

    let { page, query, documentSqid } = $props();

    // Simple text highlighting function that works with HTML
    function highlightText(text: string, searchQuery: string): string {
        if (!searchQuery || !text) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    }

    // Function to truncate text
    function truncateText(text: string, maxLength: number = 200): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Simple markdown to HTML converter for basic formatting
    function renderSnippet(snippet: string, searchQuery: string): string {
        if (!snippet) return '';

        // First truncate
        const truncated = truncateText(snippet);

        // Simple markdown conversion
        let html = truncated
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>') // Code
            .replace(/\n/g, '<br>'); // Line breaks

        // Apply highlighting
        return highlightText(html, searchQuery);
    }

    // Navigate to document page
    function handleClick() {
        if (documentSqid) {
            goto(`/documents/${documentSqid}?page=${page.page_number}`);
        }
    }
</script>

<button
    class="w-full p-4 border-l-4 border-gray-200 ml-4 hover:bg-gray-50 transition-colors text-left bg-transparent border-0"
    onclick={handleClick}
    type="button"
>
    <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
            <FileText class="h-4 w-4 text-gray-400 mt-1" />
        </div>

        <div class="flex-1 min-w-0">
            <!-- Page Info -->
            <div class="flex items-center space-x-2 mb-2">
                <span class="text-sm font-medium text-gray-700">
                    Page {page.page_number}
                </span>
                {#if page.relevance_score}
                    <span class="text-gray-400">•</span>
                    <span class="text-xs text-gray-500">
                        {Math.round(page.relevance_score * 100)}% match
                    </span>
                {/if}
            </div>

            <!-- Search Result Content - Snippet with Markdown -->
            {#if page.snippet}
                <div class="text-sm text-gray-800 leading-relaxed mb-2 prose prose-sm max-w-none">
                    {@html renderSnippet(page.snippet, query)}
                </div>
            {/if}

            <!-- Metadata -->
            <div class="flex items-center justify-between mt-3">
                <div class="flex items-center space-x-4 text-xs text-gray-500">
                    {#if page.processing_status}
                        <span class="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {page.processing_status}
                        </span>
                    {/if}

                    {#if page.created_at}
                        <span>
                            {new Date(page.created_at).toLocaleDateString()}
                        </span>
                    {/if}
                </div>

                <ArrowRight class="h-4 w-4 text-gray-400" />
            </div>
        </div>
    </div>
</button>
