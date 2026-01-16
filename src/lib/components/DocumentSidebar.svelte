<script lang="ts">
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { X, Save, RotateCcw } from 'lucide-svelte';
	import { documentsApiUpdatePage } from '$lib/api/sdk.gen';

	let { page, onClose, onUpdate } = $props();

	let editedContent = $state('');
	let hasChanges = $state(false);

	// Initialize content when page changes
	$effect(() => {
		editedContent = page.content || '';
		hasChanges = false;
	});

	const queryClient = useQueryClient();

	// Update page content mutation
	const updatePageMutation = createMutation(() => ({
		mutationFn: async ({ pageId, content }: { pageId: string; content: string }) => {
			const response = await documentsApiUpdatePage({
				path: { sqid: pageId },
				body: { content }
			});
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['document-pages'] });
			hasChanges = false;
			onUpdate?.();
		}
	}));

	function handleContentChange() {
		hasChanges = editedContent !== (page.content || '');
	}

	function handleSave() {
		if (hasChanges && editedContent !== (page.content || '')) {
			updatePageMutation.mutate({
				pageId: page.sqid,
				content: editedContent
			});
		}
	}

	function handleReset() {
		editedContent = page.content || '';
		hasChanges = false;
	}

	function handleClose() {
		if (hasChanges) {
			if (confirm('You have unsaved changes. Are you sure you want to close?')) {
				onClose();
			}
		} else {
			onClose();
		}
	}
</script>

<div class="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
	<!-- Header -->
	<div class="flex items-center justify-between p-4 border-b border-gray-200">
		<div>
			<h3 class="text-lg font-medium text-gray-900">Edit OCR Text</h3>
			<p class="text-sm text-gray-600">Page {page.page_number}</p>
		</div>
		<button
			onclick={handleClose}
			class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
		>
			<X class="h-5 w-5 text-gray-500" />
		</button>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-hidden flex flex-col">
		<!-- Text Editor -->
		<div class="flex-1 p-4">
			<label for="content-editor" class="block text-sm font-medium text-gray-700 mb-2">
				Page Content
			</label>
			<textarea
				id="content-editor"
				bind:value={editedContent}
				oninput={handleContentChange}
				placeholder="Enter the corrected text content for this page..."
				class="w-full h-full resize-none border border-gray-300 rounded-lg p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			></textarea>
		</div>

		<!-- Page Info -->
		<div class="p-4 border-t border-gray-200 bg-gray-50">
			<h4 class="text-sm font-medium text-gray-900 mb-2">Page Information</h4>
			<div class="space-y-2 text-xs text-gray-600">
				{#if page.confidence_score !== undefined}
					<div>
						<span class="font-medium">OCR Confidence:</span>
						<span class="ml-1">{Math.round((page.confidence_score || 0) * 100)}%</span>
					</div>
				{/if}

				{#if page.language}
					<div>
						<span class="font-medium">Language:</span>
						<span class="ml-1">{page.language}</span>
					</div>
				{/if}

				{#if page.word_count}
					<div>
						<span class="font-medium">Word Count:</span>
						<span class="ml-1">{page.word_count}</span>
					</div>
				{/if}

				{#if page.updated_at}
					<div>
						<span class="font-medium">Last Updated:</span>
						<span class="ml-1">{new Date(page.updated_at).toLocaleString()}</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="p-4 border-t border-gray-200 bg-white">
		<div class="flex items-center justify-between space-x-3">
			<button
				onclick={handleReset}
				disabled={!hasChanges}
				class="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
			>
				<RotateCcw class="h-4 w-4" />
				<span>Reset</span>
			</button>

			<button
				onclick={handleSave}
				disabled={!hasChanges || updatePageMutation.isPending}
				class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
			>
				{#if updatePageMutation.isPending}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					<span>Saving...</span>
				{:else}
					<Save class="h-4 w-4" />
					<span>Save Changes</span>
				{/if}
			</button>
		</div>

		{#if hasChanges}
			<p class="text-xs text-amber-600 mt-2">You have unsaved changes</p>
		{/if}

		{#if updatePageMutation.error}
			<p class="text-xs text-red-600 mt-2">
				Error saving: {updatePageMutation.error.message}
			</p>
		{/if}
	</div>
</div>

