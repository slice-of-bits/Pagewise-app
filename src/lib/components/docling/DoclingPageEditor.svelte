<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { documentsApiGetPageOptions, documentsApiUpdatePageMutation } from '$lib/api/@tanstack/svelte-query.gen';
	import DoclingBBoxViewer from './DoclingBBoxViewer.svelte';
	import DoclingDataEditor from './DoclingDataEditor.svelte';
	import DoclingColorLegend from './DoclingColorLegend.svelte';
	import { Save, AlertCircle, Eye, EyeOff, X, Check, Info } from 'lucide-svelte';
	import { beforeNavigate } from '$app/navigation';

	interface BBox {
		l: number;
		t: number;
		r: number;
		b: number;
	}

	interface DoclingBlock {
		type: string;
		text?: string;
		bbox?: BBox;
		[key: string]: any;
	}

	interface DoclingData {
		blocks?: DoclingBlock[];
		[key: string]: any;
	}

	interface Props {
		pageSqid: string;
		onClose?: () => void;
	}

	let { pageSqid, onClose }: Props = $props();

	let selectedBlockIndex = $state<number | null>(null);
	let showLabels = $state(true);
	let showLegend = $state(false);
	let hasUnsavedChanges = $state(false);
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);
	let editedBlocks = $state<DoclingBlock[]>([]);

	const queryClient = useQueryClient();

	// Available block types from Docling
	const blockTypes = [
		'text',
		'title',
		'heading',
		'paragraph',
		'list',
		'table',
		'figure',
		'caption',
		'formula',
		'footnote',
		'page_header',
		'page_footer',
		'code'
	];

	// Fetch page data - use derived to reactively update when pageSqid changes
	const pageQuery = $derived(createQuery({
		...documentsApiGetPageOptions({
			path: { sqid: pageSqid }
		})
	}));

	// Update page mutation
	const updatePageMutation = createMutation({
		...documentsApiUpdatePageMutation(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['documentsApiGetPage'] });
			hasUnsavedChanges = false;
			saveSuccess = true;
			setTimeout(() => {
				saveSuccess = false;
			}, 3000);
		},
		onError: (error: any) => {
			saveError = error?.message || 'Failed to save changes';
			setTimeout(() => {
				saveError = null;
			}, 5000);
		}
	});

	// Extract docling data from page metadata
	let doclingData = $derived.by(() => {
		if (!$pageQuery.data?.metadata) return null;

		// Debug: Log the page data structure
		console.log('[DoclingPageEditor] Page data:', {
			hasTopLevelDoclingJson: !!pageData.docling_json,
			hasTopLevelDoclingJsonOverride: !!pageData.docling_json_override,
			hasMetadata: !!pageData.metadata,
			hasMetadataDoclingJson: !!pageData.metadata?.docling_json,
			hasMetadataDoclingJsonOverride: !!pageData.metadata?.docling_json_override,
			pageData: pageData
		});

		// First, check top-level fields (per API schema)
		if (pageData.docling_json_override) {
			console.log('[DoclingPageEditor] Using top-level docling_json_override');
			return pageData.docling_json_override as DoclingData;
		} else if (pageData.docling_json) {
			console.log('[DoclingPageEditor] Using top-level docling_json');
			return pageData.docling_json as DoclingData;
		}

		// Fallback: check in metadata (for backward compatibility)
		const metadata = pageData.metadata;
		if (metadata) {
			if (metadata.docling_json_override) {
				console.log('[DoclingPageEditor] Using metadata.docling_json_override');
				return metadata.docling_json_override as DoclingData;
			} else if (metadata.docling_json) {
				console.log('[DoclingPageEditor] Using metadata.docling_json');
				return metadata.docling_json as DoclingData;
			}
		}

		console.log('[DoclingPageEditor] No docling data found in any location');
		return null;
	});

	let blocks = $derived(doclingData?.blocks || []);

	let imageUrl = $derived($pageQuery.data?.page_image || '');

	// Initialize edited blocks when data loads
	$effect(() => {
		if (blocks.length > 0 && editedBlocks.length === 0) {
			editedBlocks = JSON.parse(JSON.stringify(blocks));
		}
	});

	function handleBlocksChange(newBlocks: DoclingBlock[]) {
		editedBlocks = newBlocks;
		hasUnsavedChanges = true;
	}

	async function handleSave() {
		if (!$pageQuery.data || isSaving) return;

		try {
			isSaving = true;
			saveError = null;

			const metadata = { ...($pageQuery.data.metadata || {}) };

			// Construct the updated docling data and save to docling_json_override
			metadata.docling_json_override = {
				...(doclingData || {}),
				blocks: editedBlocks
			};

			await $updatePageMutation.mutateAsync({
				path: { sqid: pageSqid },
				body: { metadata }
			});
		} catch (error) {
			console.error('Failed to save:', error);
		} finally {
			isSaving = false;
		}
	}

	// Warn before navigating away with unsaved changes
	beforeNavigate(({ cancel }) => {
		if (hasUnsavedChanges) {
			if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
				cancel();
			}
		}
	});

	// Keyboard shortcut for save (Ctrl+S or Cmd+S)
	function handleKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 's') {
			event.preventDefault();
			if (hasUnsavedChanges && !isSaving) {
				handleSave();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 bg-white z-50 flex flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
		<div class="flex items-center space-x-4">
			<h2 class="text-xl font-semibold text-gray-900">Edit Docling Data</h2>
			<span class="text-sm text-gray-500">
				Page {$pageQuery.data?.page_number || '...'}
			</span>
		</div>

		<div class="flex items-center space-x-3">
			<!-- Toggle Labels -->
			<button
				onclick={() => (showLabels = !showLabels)}
				class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
				title={showLabels ? 'Hide labels' : 'Show labels'}
			>
				{#if showLabels}
					<EyeOff class="h-4 w-4" />
					<span>Hide Labels</span>
				{:else}
					<Eye class="h-4 w-4" />
					<span>Show Labels</span>
				{/if}
			</button>

			<!-- Toggle Legend -->
			<button
				onclick={() => (showLegend = !showLegend)}
				class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
				title="Show color legend"
			>
				<Info class="h-4 w-4" />
				<span>Legend</span>
			</button>

			<!-- Save Button -->
			<button
				onclick={handleSave}
				disabled={!hasUnsavedChanges || isSaving}
				class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
			>
				{#if isSaving}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					<span>Saving...</span>
				{:else if saveSuccess}
					<Check class="h-4 w-4" />
					<span>Saved!</span>
				{:else}
					<Save class="h-4 w-4" />
					<span>Save Changes</span>
				{/if}
			</button>

			<!-- Close Button -->
			<button
				onclick={() => {
					if (hasUnsavedChanges) {
						if (confirm('You have unsaved changes. Are you sure you want to close?')) {
							if (onClose) onClose();
						}
					} else {
						if (onClose) onClose();
					}
				}}
				class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
				title="Close editor"
			>
				<X class="h-5 w-5" />
			</button>
		</div>
	</div>

	<!-- Page Navigation (if multiple pages) -->
	{#if totalPages > 1}
		<div class="bg-white border-b border-gray-200 px-6 py-3">
			<div class="flex items-center justify-between">
				<button
					onclick={previousPage}
					disabled={currentPageNumber === 1 || hasUnsavedChanges}
					class="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
					title={hasUnsavedChanges ? 'Save changes before navigating' : 'Previous page'}
				>
					<ChevronLeft class="h-4 w-4" />
					<span>Previous</span>
				</button>

				<div class="flex items-center space-x-4">
					<span class="text-sm text-gray-600">
						Page {currentPageNumber} of {totalPages}
					</span>

					<div class="flex items-center space-x-2">
						<label for="page-input-editor" class="text-sm text-gray-600">Go to:</label>
						<input
							id="page-input-editor"
							type="number"
							min="1"
							max={totalPages}
							value={currentPageNumber}
							oninput={(e) => goToPage(parseInt(e.currentTarget.value))}
							disabled={hasUnsavedChanges}
							class="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center disabled:opacity-50"
							title={hasUnsavedChanges ? 'Save changes before navigating' : ''}
						/>
					</div>
				</div>

				<button
					onclick={nextPage}
					disabled={currentPageNumber === totalPages || hasUnsavedChanges}
					class="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
					title={hasUnsavedChanges ? 'Save changes before navigating' : 'Next page'}
				>
					<span>Next</span>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}

	<!-- Status Messages -->
	{#if saveError}
		<div class="px-6 py-3 bg-red-50 border-b border-red-200">
			<div class="flex items-center space-x-2 text-red-800">
				<AlertCircle class="h-4 w-4" />
				<span class="text-sm">{saveError}</span>
			</div>
		</div>
	{/if}

	{#if hasUnsavedChanges && !saveSuccess}
		<div class="px-6 py-2 bg-amber-50 border-b border-amber-200">
			<p class="text-sm text-amber-800">
				You have unsaved changes. Press <kbd class="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-mono">Ctrl+S</kbd> to save.
			</p>
		</div>
	{/if}

	<!-- Main Content -->
	<div class="flex-1 flex overflow-hidden">
		{#if $pageQuery.isLoading}
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p class="mt-4 text-gray-600">Loading page data...</p>
				</div>
			</div>
		{:else if $pageQuery.isError}
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center">
					<AlertCircle class="h-12 w-12 text-red-500 mx-auto mb-4" />
					<p class="text-red-600 font-medium">Failed to load page data</p>
					<p class="text-sm text-gray-600 mt-2">{$pageQuery.error?.message || 'Unknown error'}</p>
				</div>
			</div>
		{:else if !doclingData}
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center max-w-md">
					<AlertCircle class="h-12 w-12 text-amber-500 mx-auto mb-4" />
					<p class="text-gray-900 font-medium">No Docling Data Available</p>
					<p class="text-sm text-gray-600 mt-2">
						This page doesn't have Docling processing data yet. The page may still be processing,
						or it may not have been processed with Docling.
					</p>
				</div>
			</div>
		{:else}
			<!-- Viewer (Left) -->
			<div class="flex-1 border-r border-gray-200 overflow-hidden relative">
				<DoclingBBoxViewer
					{imageUrl}
					blocks={editedBlocks}
					bind:selectedBlockIndex
					bind:showLabels
				/>

				<!-- Color Legend Overlay -->
				<DoclingColorLegend
					bind:show={showLegend}
					onClose={() => showLegend = false}
				/>
			</div>

			<!-- Editor (Right) -->
			<div class="w-96 overflow-hidden">
				<DoclingDataEditor
					bind:blocks={editedBlocks}
					bind:selectedBlockIndex
					{blockTypes}
					onBlocksChange={handleBlocksChange}
					onBlockSelect={(index) => (selectedBlockIndex = index)}
				/>
			</div>
		{/if}
	</div>

	<!-- Footer Stats -->
	{#if $pageQuery.isSuccess && doclingData}
		<div class="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm">
			<div class="text-gray-600">
				{editedBlocks.length} blocks
				{#if selectedBlockIndex !== null}
					• Block #{selectedBlockIndex} selected
				{/if}
			</div>
			<div class="text-gray-500">
				{#if hasUnsavedChanges}
					<span class="text-amber-600 font-medium">● Unsaved changes</span>
				{:else}
					<span class="text-green-600">● All changes saved</span>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	kbd {
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
</style>
