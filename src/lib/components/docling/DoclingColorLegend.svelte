<script lang="ts">
	import { X } from 'lucide-svelte';

	interface Props {
		show?: boolean;
		onClose?: () => void;
	}

	let { show = $bindable(false), onClose }: Props = $props();

	const colorMap = [
		{ type: 'text', color: '#3B82F6', label: 'Text' },
		{ type: 'title', color: '#8B5CF6', label: 'Title' },
		{ type: 'heading', color: '#6366F1', label: 'Heading' },
		{ type: 'paragraph', color: '#3B82F6', label: 'Paragraph' },
		{ type: 'list', color: '#10B981', label: 'List' },
		{ type: 'table', color: '#F59E0B', label: 'Table' },
		{ type: 'figure', color: '#EC4899', label: 'Figure' },
		{ type: 'caption', color: '#14B8A6', label: 'Caption' },
		{ type: 'formula', color: '#F97316', label: 'Formula' },
		{ type: 'footnote', color: '#6B7280', label: 'Footnote' },
		{ type: 'page_header', color: '#84CC16', label: 'Page Header' },
		{ type: 'page_footer', color: '#06B6D4', label: 'Page Footer' },
		{ type: 'code', color: '#EF4444', label: 'Code' }
	];
</script>

{#if show}
	<div class="absolute top-20 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10 max-w-xs">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-sm font-semibold text-gray-900">Block Type Colors</h3>
			<button
				type="button"
				onclick={onClose}
				class="text-gray-400 hover:text-gray-600"
				title="Close legend"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<div class="space-y-2">
			{#each colorMap as item}
				<div class="flex items-center space-x-2 text-sm">
					<div
						class="w-4 h-4 rounded border border-gray-300"
						style="background-color: {item.color};"
					></div>
					<span class="text-gray-700">{item.label}</span>
				</div>
			{/each}
		</div>

		<div class="mt-3 pt-3 border-t border-gray-200">
			<p class="text-xs text-gray-500">
				Click on any bounding box in the image to select and edit it.
			</p>
		</div>
	</div>
{/if}
