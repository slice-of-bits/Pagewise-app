<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Settings, Plus, Edit, Trash2, Star, StarOff, Check, AlertCircle } from 'lucide-svelte';
	import {
		doclingPresetsApiListDoclingPresetsOptions,
		doclingPresetsApiCreateDoclingPresetMutation,
		doclingPresetsApiUpdateDoclingPresetMutation,
		doclingPresetsApiDeleteDoclingPresetMutation,
		doclingPresetsApiSetDefaultDoclingPresetMutation
	} from '$lib/api/@tanstack/svelte-query.gen';
	import type { DoclingPresetSchema, DoclingPresetCreateSchema } from '$lib/api';
	import DoclingPresetForm from '$lib/components/DoclingPresetForm.svelte';

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let editingPreset = $state<DoclingPresetSchema | null>(null);
	let showDeleteConfirm = $state(false);
	let deletingPreset = $state<DoclingPresetSchema | null>(null);

	const queryClient = useQueryClient();

	// Fetch presets
	const presetsQuery = createQuery({
		...doclingPresetsApiListDoclingPresetsOptions()
	});

	// Create preset mutation
	const createPresetMutation = createMutation({
		...doclingPresetsApiCreateDoclingPresetMutation(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['doclingPresetsApiListDoclingPresets'] });
			showCreateModal = false;
		}
	});

	// Update preset mutation
	const updatePresetMutation = createMutation({
		...doclingPresetsApiUpdateDoclingPresetMutation(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['doclingPresetsApiListDoclingPresets'] });
			showEditModal = false;
			editingPreset = null;
		}
	});

	// Delete preset mutation
	const deletePresetMutation = createMutation({
		...doclingPresetsApiDeleteDoclingPresetMutation(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['doclingPresetsApiListDoclingPresets'] });
			showDeleteConfirm = false;
			deletingPreset = null;
		}
	});

	// Set default preset mutation
	const setDefaultMutation = createMutation({
		...doclingPresetsApiSetDefaultDoclingPresetMutation(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['doclingPresetsApiListDoclingPresets'] });
		}
	});

	async function handleCreatePreset(data: DoclingPresetCreateSchema) {
		await $createPresetMutation.mutateAsync({ body: data });
	}

	async function handleUpdatePreset(data: DoclingPresetCreateSchema) {
		if (!editingPreset) return;
		await $updatePresetMutation.mutateAsync({
			path: { sqid: editingPreset.sqid },
			body: data
		});
	}

	async function handleDeletePreset() {
		if (!deletingPreset) return;
		await $deletePresetMutation.mutateAsync({
			path: { sqid: deletingPreset.sqid }
		});
	}

	async function handleSetDefault(preset: DoclingPresetSchema) {
		await $setDefaultMutation.mutateAsync({
			path: { sqid: preset.sqid }
		});
	}

	function openEditModal(preset: DoclingPresetSchema) {
		editingPreset = preset;
		showEditModal = true;
	}

	function openDeleteConfirm(preset: DoclingPresetSchema) {
		deletingPreset = preset;
		showDeleteConfirm = true;
	}

	let presets = $derived($presetsQuery.data?.items || []);
</script>

<svelte:head>
	<title>Docling Presets - Pagewise</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Docling Presets</h1>
			<p class="mt-2 text-gray-600">
				Manage document processing presets for Docling OCR engine
			</p>
		</div>

		<button
			onclick={() => showCreateModal = true}
			class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
		>
			<Plus class="h-5 w-5" />
			<span>New Preset</span>
		</button>
	</div>

	<!-- Presets List -->
	{#if $presetsQuery.isLoading}
		<div class="text-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
			<p class="mt-4 text-gray-600">Loading presets...</p>
		</div>
	{:else if $presetsQuery.error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex items-start space-x-3">
				<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
				<div>
					<p class="font-medium text-red-900">Error loading presets</p>
					<p class="text-sm text-red-700 mt-1">
						{$presetsQuery.error.message}
					</p>
				</div>
			</div>
		</div>
	{:else if presets.length === 0}
		<div class="text-center py-12 bg-white rounded-lg border border-gray-200">
			<Settings class="h-12 w-12 text-gray-400 mx-auto" />
			<h3 class="mt-4 text-lg font-medium text-gray-900">No presets yet</h3>
			<p class="mt-2 text-gray-600">Create your first Docling preset to get started</p>
			<button
				onclick={() => showCreateModal = true}
				class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Create Preset
			</button>
		</div>
	{:else}
		<div class="space-y-4">
			{#each presets as preset (preset.sqid)}
				<div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center space-x-3">
								<h3 class="text-lg font-medium text-gray-900">{preset.name}</h3>
								{#if preset.is_default}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										<Star class="h-3 w-3 mr-1" />
										Default
									</span>
								{/if}
							</div>

							<div class="mt-4 grid grid-cols-2 gap-4 text-sm">
								<div>
									<span class="font-medium text-gray-700">Pipeline:</span>
									<span class="ml-2 text-gray-600">{preset.pipeline_type}</span>
								</div>
								<div>
									<span class="font-medium text-gray-700">OCR Engine:</span>
									<span class="ml-2 text-gray-600">{preset.ocr_engine}</span>
								</div>
								<div>
									<span class="font-medium text-gray-700">Languages:</span>
									<span class="ml-2 text-gray-600">{preset.ocr_languages.join(', ')}</span>
								</div>
								<div>
									<span class="font-medium text-gray-700">Force OCR:</span>
									<span class="ml-2 text-gray-600">{preset.force_ocr ? 'Yes' : 'No'}</span>
								</div>
							</div>

							<div class="mt-4 flex flex-wrap gap-2">
								{#if preset.enable_picture_description}
									<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
										<Check class="h-3 w-3 mr-1" />
										Picture Description
									</span>
								{/if}
								{#if preset.enable_table_structure}
									<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
										<Check class="h-3 w-3 mr-1" />
										Table Structure
									</span>
								{/if}
								{#if preset.enable_code_enrichment}
									<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
										<Check class="h-3 w-3 mr-1" />
										Code Enrichment
									</span>
								{/if}
								{#if preset.enable_formula_enrichment}
									<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
										<Check class="h-3 w-3 mr-1" />
										Formula Enrichment
									</span>
								{/if}
							</div>
						</div>

						<div class="flex items-center space-x-2 ml-4">
							{#if !preset.is_default}
								<button
									onclick={() => handleSetDefault(preset)}
									disabled={$setDefaultMutation.isPending}
									class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
									title="Set as default"
								>
									<StarOff class="h-5 w-5" />
								</button>
							{/if}

							<button
								onclick={() => openEditModal(preset)}
								class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
								title="Edit preset"
							>
								<Edit class="h-5 w-5" />
							</button>

							{#if !preset.is_default}
								<button
									onclick={() => openDeleteConfirm(preset)}
									class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
									title="Delete preset"
								>
									<Trash2 class="h-5 w-5" />
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Preset Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-gray-50 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-900">Create New Preset</h2>
				<button
					onclick={() => showCreateModal = false}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Close modal"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-6">
				<DoclingPresetForm
					onSubmit={handleCreatePreset}
					onCancel={() => showCreateModal = false}
					isSubmitting={$createPresetMutation.isPending}
					submitLabel="Create Preset"
				/>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Preset Modal -->
{#if showEditModal && editingPreset}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-gray-50 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
			<div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
				<h2 class="text-xl font-bold text-gray-900">Edit Preset</h2>
				<button
					onclick={() => {
						showEditModal = false;
						editingPreset = null;
					}}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Close modal"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-6">
				<DoclingPresetForm
					preset={editingPreset}
					onSubmit={handleUpdatePreset}
					onCancel={() => {
						showEditModal = false;
						editingPreset = null;
					}}
					isSubmitting={$updatePresetMutation.isPending}
					submitLabel="Update Preset"
				/>
			</div>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && deletingPreset}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg max-w-md w-full p-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Delete Preset</h3>
			<p class="text-gray-600 mb-6">
				Are you sure you want to delete the preset "{deletingPreset.name}"? This action cannot be undone.
			</p>
			<div class="flex justify-end space-x-4">
				<button
					onclick={() => {
						showDeleteConfirm = false;
						deletingPreset = null;
					}}
					class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					onclick={handleDeletePreset}
					disabled={$deletePresetMutation.isPending}
					class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
				>
					{#if $deletePresetMutation.isPending}
						Deleting...
					{:else}
						Delete
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
