<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { Upload, FileText, FolderPlus, X, Check, AlertCircle } from 'lucide-svelte';
	import { bucketApiListBuckets, bucketApiCreateBucket } from '$lib/api/sdk.gen';
	import { MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, API_BASE_URL } from '$lib/api/index';

	let files: FileList | null = $state(null);
	let title = $state('');
	let selectedBucket = $state('');
	let createNewBucket = $state(false);
	let newBucketName = $state('');
	let newBucketDescription = $state('');
	let dragOver = $state(false);
	let uploadProgress = $state(0);
	let isUploading = $state(false);

	const queryClient = useQueryClient();

	// Fetch buckets
	const bucketsQuery = createQuery(() => ({
		queryKey: ['buckets'],
		queryFn: async () => {
			const response = await bucketApiListBuckets();
			return response.data || [];
		}
	}));

	// Create bucket mutation
	const createBucketMutation = createMutation(() => ({
		mutationFn: async ({ name, description }: { name: string; description?: string }) => {
			const response = await bucketApiCreateBucket({
				body: { name, description }
			});
			return response.data;
		},
		onSuccess: (data: any) => {
			queryClient.invalidateQueries({ queryKey: ['buckets'] });
			selectedBucket = data.sqid;
			createNewBucket = false;
			newBucketName = '';
			newBucketDescription = '';
		}
	}));

	// Upload mutation
	const uploadMutation = createMutation(() => ({
		mutationFn: async ({ file, title, bucketSqid }: { file: File; title: string; bucketSqid?: string }) => {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('title', title);
			if (bucketSqid) formData.append('group_sqid', bucketSqid);

			// Use fetch with full API URL for file upload
			const response = await fetch(`${API_BASE_URL}/api/documents/upload/`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(`Upload failed: ${response.statusText}`);
			}

			return response.json();
		},
		onSuccess: (data) => {
			// Track the processing task
			if (data.task_id) {
				progressService.trackTask(data.task_id);
			}

			queryClient.invalidateQueries({ queryKey: ['documents'] });
			goto(`/documents/${data.sqid}`);
		}
	}));

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
				if (file.size > MAX_FILE_SIZE_BYTES) {
					alert(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB`);
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

	async function handleCreateBucket() {
		if (!newBucketName.trim()) return;

		try {
			await createBucketMutation.mutateAsync({
				name: newBucketName.trim(),
				description: newBucketDescription.trim() || undefined
			});
		} catch (error) {
			console.error('Failed to create bucket:', error);
		}
	}

	async function handleUpload() {
		if (!files || files.length === 0 || !title.trim()) return;

		try {
			isUploading = true;
			await uploadMutation.mutateAsync({
				file: files[0],
				title: title.trim(),
				bucketSqid: selectedBucket || undefined
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

	let canUpload = $derived(files && files.length > 0 && title.trim() && !isUploading);
	let selectedFile = $derived(files && files.length > 0 ? files[0] : null);
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
					>
								<Upload class="mx-auto h-12 w-12 text-gray-400" />
								<p class="mt-4 text-lg font-medium text-gray-900">
									Drop your PDF here, or click to select
								</p>
								<p class="mt-2 text-sm text-gray-600">
									PDF files only, up to {MAX_FILE_SIZE_MB}MB ({(MAX_FILE_SIZE_MB / 1024).toFixed(1)}GB)
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

					<!-- Bucket Selection -->
					<div>
						<label for="bucket" class="block text-sm font-medium text-gray-700 mb-1">
							Bucket (optional)
						</label>

						{#if !createNewBucket}
							<div class="flex space-x-2">
								<select
									id="bucket"
									bind:value={selectedBucket}
									class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="">Select a bucket...</option>
									{#each (bucketsQuery.data as any[]) || [] as bucket (bucket.sqid)}
										<option value={bucket.sqid}>{bucket.name}</option>
									{/each}
								</select>

								<button
									onclick={() => createNewBucket = true}
									class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
									title="Create new bucket"
								>
									<FolderPlus class="h-4 w-4" />
								</button>
							</div>
						{:else}
							<div class="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700">Create New Bucket</span>
									<button
										onclick={() => {
											createNewBucket = false;
											newBucketName = '';
											newBucketDescription = '';
										}}
										class="text-gray-400 hover:text-gray-600"
									>
										<X class="h-4 w-4" />
									</button>
								</div>

								<input
									type="text"
									bind:value={newBucketName}
									placeholder="Bucket name"
									class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
								/>

								<textarea
									bind:value={newBucketDescription}
									placeholder="Description (optional)"
									rows="2"
									class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
								></textarea>

								<button
									onclick={handleCreateBucket}
									disabled={!newBucketName.trim() || createBucketMutation.isPending}
									class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
								>
									{#if createBucketMutation.isPending}
										Creating...
									{:else}
										Create Bucket
									{/if}
								</button>
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

{#if uploadMutation.error}
	<div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
		<div class="flex items-start space-x-3">
			<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0" />
			<div>
				<p class="font-medium text-red-900">Upload Failed</p>
				<p class="text-sm text-red-700 mt-1">
					{uploadMutation.error.message || 'An error occurred during upload'}
				</p>
			</div>
		</div>
	</div>
{/if}

