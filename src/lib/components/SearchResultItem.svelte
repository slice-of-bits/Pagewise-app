<script lang="ts">
	import { FileText, ArrowRight } from 'lucide-svelte';

	let { result, query, onClick } = $props();

	function highlightText(text: string, searchQuery: string) {
		if (!searchQuery || !text) return text;

		const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
	}

	function truncateText(text: string, maxLength: number = 200) {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

<button
	class="w-full p-6 hover:bg-gray-50 transition-colors cursor-pointer text-left border-0 bg-transparent"
	onclick={onClick}
	type="button"
>
	<div class="flex items-start space-x-4">
		<div class="flex-shrink-0">
			<FileText class="h-5 w-5 text-gray-400 mt-1" />
		</div>

		<div class="flex-1 min-w-0">
			<!-- Document and Page Info -->
			<div class="flex items-center space-x-2 mb-2">
				<h3 class="text-sm font-medium text-gray-900 truncate">
					{result.document_title}
				</h3>
				<span class="text-gray-400">•</span>
				<span class="text-sm text-gray-600">
					Page {result.page_number}
				</span>
				{#if result.confidence_score}
					<span class="text-gray-400">•</span>
					<span class="text-xs text-gray-500">
						{Math.round(result.confidence_score * 100)}% match
					</span>
				{/if}
			</div>

			<!-- Search Result Content -->
			{#if result.matched_text}
				<div class="text-sm text-gray-800 leading-relaxed">
					{@html highlightText(truncateText(result.matched_text), query)}
				</div>
			{/if}

			<!-- Page Context -->
			{#if result.page_content && result.page_content !== result.matched_text}
				<div class="mt-2 text-xs text-gray-600 leading-relaxed">
					{@html highlightText(truncateText(result.page_content, 150), query)}
				</div>
			{/if}

			<!-- Metadata -->
			<div class="flex items-center justify-between mt-3">
				<div class="flex items-center space-x-4 text-xs text-gray-500">
					{#if result.bucket_name}
						<span class="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800">
							{result.bucket_name}
						</span>
					{/if}

					{#if result.page_type}
						<span>Type: {result.page_type}</span>
					{/if}

					{#if result.created_at}
						<span>
							{new Date(result.created_at).toLocaleDateString()}
						</span>
					{/if}
				</div>

				<ArrowRight class="h-4 w-4 text-gray-400" />
			</div>
		</div>
	</div>
</button>
