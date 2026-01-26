<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { Upload, FileText, FolderPlus, X, Check, AlertCircle, Settings, Plus } from 'lucide-svelte';
	import {
		pondsApiListPondsOptions,
        pondsApiCreatePondMutation,
		doclingPresetsApiListDoclingPresetsOptions,
		doclingPresetsApiCreateDoclingPresetMutation,
		ocrPresetsApiListOcrPresetsOptions,
		ocrPresetsApiCreateOcrPresetMutation
	} from '$lib/api/@tanstack/svelte-query.gen';
	import { PUBLIC_MAX_FILE_SIZE_MB, PUBLIC_API_HOST } from '$env/static/public';
	import type { DoclingPresetCreateSchema, OcrPresetCreateSchema } from '$lib/api';
	import DoclingPresetForm from '$lib/components/DoclingPresetForm.svelte';
	import OcrPresetForm from '$lib/components/OcrPresetForm.svelte';

	let files: FileList | null = $state(null);
	let title = $state('');
	let selectedGroup = $state('');
	let selectedPreset = $state('');
	let selectedOcrPreset = $state('');
	let createNewPreset = $state(false);
	let createNewOcrPreset = $state(false);
	let createNewGroup = $state(false);
	let newGroupName = $state('');
	let newGroupDescription = $state('');
	let dragOver = $state(false);
	let isUploading = $state(false);

	// Convert MB to bytes
	const MAX_FILE_SIZE_MB = parseInt(PUBLIC_MAX_FILE_SIZE_MB);
	const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

	const queryClient = useQueryClient();

	// Fetch groups
	const groupsQuery = createQuery({
		...pondsApiListPondsOptions()
	});

	// Fetch Docling presets
	const presetsQuery = createQuery({
		...doclingPresetsApiListDoclingPresetsOptions()
	});

	// Fetch OCR presets
	const ocrPresetsQuery = createQuery({
		...ocrPresetsApiListOcrPresetsOptions()
	});

	// Create group mutation
	const createGroupMutation = createMutation({
		...pondsApiCreatePondMutation(),
		onSuccess: (data: any) => {
			queryClient.invalidateQueries({ queryKey: ['groups'] });
			selectedGroup = data.sqid;
			createNewGroup = false;
			newGroupName = '';
			newGroupDescription = '';
		}
	});

	// Create preset mutation
	const createPresetMutation = createMutation({
		...doclingPresetsApiCreateDoclingPresetMutation(),
		onSuccess: (data: any) => {
			queryClient.invalidateQueries({ queryKey: ['doclingPresetsApiListDoclingPresets'] });
			selectedPreset = data.sqid;
			createNewPreset = false;
		}
	});

	// Create OCR preset mutation
	const createOcrPresetMutation = createMutation({
		...ocrPresetsApiCreateOcrPresetMutation(),
		onSuccess: (data: any) => {
			queryClient.invalidateQueries({ queryKey: ['ocrPresetsApiListOcrPresets'] });
			selectedOcrPreset = data.sqid;
			createNewOcrPreset = false;
		}
	});

	// Upload mutation
	const uploadMutation = createMutation({
		mutationFn: async ({ file, title, groupSqid, presetSqid, ocrPresetSqid }: { file: File; title: string; groupSqid?: string; presetSqid?: string; ocrPresetSqid?: string }) => {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('title', title);
			if (groupSqid) formData.append('pond_sqid', groupSqid);
			if (presetSqid) formData.append('docling_preset_sqid', presetSqid);
			if (ocrPresetSqid) formData.append('ocr_preset_sqid', ocrPresetSqid);

			// Use fetch with full API URL for file upload
			const response = await fetch(`${PUBLIC_API_HOST}/api/documents/upload/`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(`Upload failed: ${response.statusText}`);
			}

			return response.json();
		},
		onSuccess: (data: any) => {
			queryClient.invalidateQueries({ queryKey: ['documents'] });
			goto(`/documents/${data.sqid}`);
		}
	});

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const selectedFiles = target.files;

		if (selectedFiles && selectedFiles.length > 0) {
			const file = selectedFiles[0];

			// Check file size
			if (file.size > MAX_FILE_SIZE_BYTES) {
				alert(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB`);
				target.value = ''; // Clear the input
				return;
			}

			files = selectedFiles;

			// Auto-generate title from filename if not set
			if (!title) {
				const filename = file.name;
				title = filename.substring(0, filename.lastIndexOf('.')) || filename;
			}
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		if (event.dataTransfer?.files) {
			const droppedFiles = event.dataTransfer.files;

			if (droppedFiles.length > 0) {
				const file = droppedFiles[0];

				// Check file size
				const maxBytes = parseInt(PUBLIC_MAX_FILE_SIZE_MB) * 1024 * 1024;
				if (file.size > maxBytes) {
					alert(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum allowed size of ${PUBLIC_MAX_FILE_SIZE_MB}MB`);
					return;
				}

				files = droppedFiles;

				// Auto-generate title from filename if not set
				if (!title) {
					const filename = file.name;
					title = filename.substring(0, filename.lastIndexOf('.')) || filename;
				}
			}
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
	}

	async function handleCreateGroup() {
		if (!newGroupName.trim()) return;

		try {
			await $createGroupMutation.mutateAsync({
				body: {
					name: newGroupName.trim(),
					description: newGroupDescription.trim() || undefined
				}
			});
		} catch (error) {
			console.error('Failed to create group:', error);
		}
	}

	async function handleCreatePreset(data: DoclingPresetCreateSchema) {
		try {
			await $createPresetMutation.mutateAsync({ body: data });
		} catch (error) {
			console.error('Failed to create preset:', error);
		}
	}

	async function handleCreateOcrPreset(data: OcrPresetCreateSchema) {
		try {
			await $createOcrPresetMutation.mutateAsync({ body: data });
		} catch (error) {
			console.error('Failed to create OCR preset:', error);
		}
	}

	async function handleUpload() {
		if (!selectedFile || !title.trim()) return;

		try {
			isUploading = true;
			await $uploadMutation.mutateAsync({
				file: selectedFile,
				title: title.trim(),
				groupSqid: selectedGroup || undefined,
				presetSqid: selectedPreset || undefined,
				ocrPresetSqid: selectedOcrPreset || undefined
			});
		} catch (error) {
			console.error('Upload failed:', error);
			isUploading = false;
		}
	}

	function clearFile() {
		files = null;
		title = '';
	}

	let groups = $derived($groupsQuery.data || []);
	let presets = $derived($presetsQuery.data?.items || []);
	let ocrPresets = $derived($ocrPresetsQuery.data || []);
	let selectedFile: File | null = $derived.by(() => {
		if (files !== null && files.length > 0) {
			return files[0];
		}
		return null;
	});
	let canUpload = $derived(selectedFile !== null && title.trim() !== '' && !isUploading);
</script>

<svelte:head>
	<title>Upload Document - Pagewise</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Upload Document</h1>
		<p class="mt-2 text-gray-600">
			Upload a PDF document to process and make it searchable at the page level.
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Upload Form -->
		<div class="lg:col-span-2 space-y-6">
			<!-- File Upload Area -->
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Select File</h2>

				{#if !selectedFile}
					<div
						class="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
						class:border-blue-400={dragOver}
						class:bg-blue-50={dragOver}
						ondrop={handleDrop}
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						role="button"
						tabindex="0"
					>
								<Upload class="mx-auto h-12 w-12 text-gray-400" />
								<p class="mt-4 text-lg font-medium text-gray-900">
									Drop your PDF here, or click to select
								</p>
								<p class="mt-2 text-sm text-gray-600">
									PDF files only, up to {(MAX_FILE_SIZE_MB / 1024).toFixed(1)}GB
								</p>

						<input
							type="file"
							accept=".pdf,application/pdf"
							onchange={handleFileSelect}
							class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
						/>
					</div>
				{:else}
					<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
						<div class="flex items-center space-x-3">
							<FileText class="h-8 w-8 text-red-600" />
							<div>
								<p class="font-medium text-gray-900">{selectedFile?.name}</p>
								<p class="text-sm text-gray-600">
									{selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(1) : '0'} MB
								</p>
							</div>
						</div>

						<button
							onclick={clearFile}
							class="p-2 hover:bg-gray-200 rounded-full transition-colors"
						>
							<X class="h-4 w-4 text-gray-400" />
						</button>
					</div>
				{/if}
			</div>

			<!-- Document Details -->
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<h2 class="text-lg font-medium text-gray-900 mb-4">Document Details</h2>

				<div class="space-y-4">
					<!-- Title -->
					<div>
						<label for="title" class="block text-sm font-medium text-gray-700 mb-1">
							Title *
						</label>
						<input
							type="text"
							id="title"
							bind:value={title}
							placeholder="Enter document title"
							class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							required
						/>
					</div>

					<!-- Group Selection -->
					<div>
						<label for="group" class="block text-sm font-medium text-gray-700 mb-1">
							Group (optional)
						</label>

						{#if !createNewGroup}
							<div class="flex space-x-2">
								<select
									id="group"
									bind:value={selectedGroup}
									class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="">Select a group...</option>
									{#each groups as group (group.sqid)}
										<option value={group.sqid}>{group.name}</option>
									{/each}
								</select>

								<button
									onclick={() => createNewGroup = true}
									class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
									title="Create new group"
								>
									<FolderPlus class="h-4 w-4" />
								</button>
							</div>
						{:else}
							<div class="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700">Create New Group</span>
									<button
										onclick={() => {
											createNewGroup = false;
											newGroupName = '';
											newGroupDescription = '';
										}}
										class="text-gray-400 hover:text-gray-600"
									>
										<X class="h-4 w-4" />
									</button>
								</div>

								<input
									type="text"
									bind:value={newGroupName}
									placeholder="Group name"
									class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
								/>

								<textarea
									bind:value={newGroupDescription}
									placeholder="Description (optional)"
									rows="2"
									class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
								></textarea>

								<button
									onclick={handleCreateGroup}
									disabled={!newGroupName.trim() || $createGroupMutation.isPending}
									class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
								>
									{#if $createGroupMutation.isPending}
										Creating...
									{:else}
										Create Group
									{/if}
								</button>
							</div>
						{/if}
					</div>

					<!-- Docling Preset Selection -->
					<div>
						<label for="preset" class="block text-sm font-medium text-gray-700 mb-1">
							Docling Preset (optional)
						</label>

						{#if !createNewPreset}
							<div class="flex space-x-2">
								<select
									id="preset"
									bind:value={selectedPreset}
									class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="">Use default preset...</option>
									{#each presets as preset (preset.sqid)}
										<option value={preset.sqid}>
											{preset.name}{preset.is_default ? ' (Default)' : ''}
										</option>
									{/each}
								</select>

								<button
									onclick={() => createNewPreset = true}
									class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
									title="Create new preset"
								>
									<Plus class="h-4 w-4" />
								</button>

								<a
									href="/system/settings/docling-presets"
									class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
									title="Manage presets"
								>
									<Settings class="h-4 w-4" />
								</a>
							</div>
							<p class="mt-1 text-sm text-gray-500">
								Choose a preset to configure OCR and processing options. <a href="/system/settings/docling-presets" class="text-blue-600 hover:text-blue-700">Manage presets</a>
							</p>
						{:else}
							<div class="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700">Create New Preset</span>
									<button
										onclick={() => createNewPreset = false}
										class="text-gray-400 hover:text-gray-600"
									>
										<X class="h-4 w-4" />
									</button>
								</div>

								<div class="text-sm text-gray-600 mb-4">
									Create a reusable preset with your preferred OCR and processing settings.
								</div>

								<DoclingPresetForm
									onSubmit={handleCreatePreset}
									onCancel={() => createNewPreset = false}
									isSubmitting={$createPresetMutation.isPending}
									submitLabel="Create & Use Preset"
								/>
							</div>
						{/if}
					</div>

					<!-- OCRmyPDF Preset Selection -->
					<div>
						<label for="ocrpreset" class="block text-sm font-medium text-gray-700 mb-1">
							OCRmyPDF Preset (optional)
						</label>

						{#if !createNewOcrPreset}
							<div class="flex space-x-2">
								<select
									id="ocrpreset"
									bind:value={selectedOcrPreset}
									class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="">Use default preset...</option>
									{#each ocrPresets as preset (preset.sqid)}
										<option value={preset.sqid}>
											{preset.name}{preset.is_default ? ' (Default)' : ''}
										</option>
									{/each}
								</select>

								<button
									onclick={() => createNewOcrPreset = true}
									class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
									title="Create new OCR preset"
								>
									<Plus class="h-4 w-4" />
								</button>

								<a
									href="/system/settings/ocr-presets"
									class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
									title="Manage OCR presets"
								>
									<Settings class="h-4 w-4" />
								</a>
							</div>
							<p class="mt-1 text-sm text-gray-500">
								Choose an OCRmyPDF preset to configure OCR behavior and image processing. <a href="/system/settings/ocr-presets" class="text-blue-600 hover:text-blue-700">Manage OCR presets</a>
							</p>
						{:else}
							<div class="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700">Create New OCR Preset</span>
									<button
										onclick={() => createNewOcrPreset = false}
										class="text-gray-400 hover:text-gray-600"
									>
										<X class="h-4 w-4" />
									</button>
								</div>

								<div class="text-sm text-gray-600 mb-4">
									Create a reusable OCRmyPDF preset with your preferred settings.
								</div>

								<OcrPresetForm
									onSubmit={handleCreateOcrPreset}
									onCancel={() => createNewOcrPreset = false}
									isSubmitting={$createOcrPresetMutation.isPending}
									submitLabel="Create & Use OCR Preset"
								/>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Upload Button -->
			<div class="flex justify-end space-x-4">
				<button
					onclick={() => goto('/')}
					class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
				>
					Cancel
				</button>

				<button
					onclick={handleUpload}
					disabled={!canUpload}
					class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
				>
					{#if isUploading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
						<span>Uploading...</span>
					{:else}
						<Upload class="h-4 w-4" />
						<span>Upload Document</span>
					{/if}
				</button>
			</div>
		</div>

		<!-- Info Sidebar -->
		<div class="space-y-6">
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<h3 class="text-lg font-medium text-gray-900 mb-4">Processing Information</h3>

				<div class="space-y-4 text-sm">
					<div class="flex items-start space-x-3">
						<Check class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
						<div>
							<p class="font-medium text-gray-900">OCR Processing</p>
							<p class="text-gray-600">Extract text from each page using advanced OCR</p>
						</div>
					</div>

					<div class="flex items-start space-x-3">
						<Check class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
						<div>
							<p class="font-medium text-gray-900">Page-Level Search</p>
							<p class="text-gray-600">Search within individual pages for precise results</p>
						</div>
					</div>

					<div class="flex items-start space-x-3">
						<Check class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
						<div>
							<p class="font-medium text-gray-900">Thumbnail Generation</p>
							<p class="text-gray-600">Create preview thumbnails for quick browsing</p>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div class="flex items-start space-x-3">
					<AlertCircle class="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
					<div class="text-sm">
						<p class="font-medium text-blue-900">Processing Time</p>
						<p class="text-blue-700 mt-1">
							Processing typically takes 1-3 minutes per page. Large files (100MB+) may take longer depending on complexity and document size.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

{#if $uploadMutation.error}
	<div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
		<div class="flex items-start space-x-3">
			<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0" />
			<div>
				<p class="font-medium text-red-900">Upload Failed</p>
				<p class="text-sm text-red-700 mt-1">
					{$uploadMutation.error.message || 'An error occurred during upload'}
				</p>
			</div>
		</div>
	</div>
{/if}

