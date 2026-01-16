<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Folder, Plus, Edit, Trash2, FileText } from 'lucide-svelte';
	import { bucketApiListBuckets, bucketApiCreateBucket, bucketApiDeleteBucket } from '$lib/api/sdk.gen';

	let showCreateModal = $state(false);
	let newBucketName = $state('');
	let newBucketDescription = $state('');

	const queryClient = useQueryClient();

	// Fetch all buckets
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['buckets'] });
			showCreateModal = false;
			newBucketName = '';
			newBucketDescription = '';
		}
	}));

	// Delete bucket mutation
	const deleteBucketMutation = createMutation(() => ({
		mutationFn: async (bucketId: string) => {
			await bucketApiDeleteBucket({
				path: { sqid: bucketId }
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['buckets'] });
		}
	}));

	function handleCreateBucket() {
		if (newBucketName.trim()) {
			createBucketMutation.mutate({
				name: newBucketName.trim(),
				description: newBucketDescription.trim() || undefined
			});
		}
	}

	function handleDeleteBucket(bucketId: string, bucketName: string) {
		if (confirm(`Are you sure you want to delete the bucket "${bucketName}"?`)) {
			deleteBucketMutation.mutate(bucketId);
		}
	}
</script>

<svelte:head>
	<title>Buckets - Pagewise</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Buckets</h1>
			<p class="mt-1 text-sm text-gray-600">
				Organize your documents into buckets for better management
			</p>
		</div>

		<button
			onclick={() => showCreateModal = true}
			class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
		>
			<Plus class="mr-2 h-4 w-4" />
			New Bucket
		</button>
	</div>

	<!-- Buckets Grid -->
	{#if bucketsQuery.isLoading}
		<div class="text-center py-12">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<p class="mt-4 text-gray-600">Loading buckets...</p>
		</div>
	{:else if bucketsQuery.error}
		<div class="text-center py-12">
			<p class="text-red-600">Error loading buckets. Please try again.</p>
		</div>
	{:else if Array.isArray(bucketsQuery.data) && bucketsQuery.data.length === 0}
		<!-- Empty State -->
		<div class="text-center py-12">
			<Folder class="mx-auto h-24 w-24 text-gray-300" />
			<h3 class="mt-4 text-lg font-medium text-gray-900">No buckets yet</h3>
			<p class="mt-2 text-gray-500">
				Get started by creating your first bucket to organize documents.
			</p>
			<div class="mt-6">
				<button
					onclick={() => showCreateModal = true}
					class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
				>
					<Plus class="mr-2 h-4 w-4" />
					Create Bucket
				</button>
			</div>
		</div>
	{:else}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each (bucketsQuery.data as any[]) || [] as bucket (bucket.sqid)}
				<div class="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
					<div class="flex items-start justify-between">
						<div class="flex items-center space-x-3 min-w-0 flex-1">
							<div class="flex-shrink-0">
								<Folder class="h-8 w-8 text-blue-600" />
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="text-lg font-medium text-gray-900 truncate">
									{bucket.name}
								</h3>
								{#if bucket.description}
									<p class="mt-1 text-sm text-gray-600 line-clamp-2">
										{bucket.description}
									</p>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<button
								class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
								title="Edit bucket"
							>
								<Edit class="h-4 w-4" />
							</button>
							<button
								onclick={() => handleDeleteBucket(bucket.sqid, bucket.name)}
								class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
								title="Delete bucket"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</div>
					</div>

					<!-- Stats -->
					<div class="mt-4 flex items-center text-sm text-gray-500">
						<FileText class="mr-1 h-4 w-4" />
						{bucket.documents_count || 0} document{(bucket.documents_count || 0) !== 1 ? 's' : ''}
					</div>

					<!-- Link to view documents -->
					<a
						href={`/documents?bucket=${bucket.sqid}`}
						class="absolute inset-0 rounded-lg"
						aria-label={`View documents in ${bucket.name}`}
					></a>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Bucket Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
			<!-- Background overlay -->
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

			<!-- Modal panel -->
			<div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
				<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
					<div class="sm:flex sm:items-start">
						<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
							<Folder class="h-6 w-6 text-blue-600" />
						</div>
						<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
							<h3 class="text-lg leading-6 font-medium text-gray-900">
								Create New Bucket
							</h3>
							<div class="mt-4 space-y-4">
								<div>
									<label for="bucket-name" class="block text-sm font-medium text-gray-700">
										Name *
									</label>
									<input
										type="text"
										id="bucket-name"
										bind:value={newBucketName}
										placeholder="Enter bucket name"
										class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
									/>
								</div>
								<div>
									<label for="bucket-description" class="block text-sm font-medium text-gray-700">
										Description (optional)
									</label>
									<textarea
										id="bucket-description"
										bind:value={newBucketDescription}
										rows={3}
										placeholder="Enter bucket description"
										class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
									></textarea>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						onclick={handleCreateBucket}
						disabled={!newBucketName.trim() || createBucketMutation.isPending}
						class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if createBucketMutation.isPending}
							Creating...
						{:else}
							Create Bucket
						{/if}
					</button>
					<button
						type="button"
						onclick={() => {
							showCreateModal = false;
							newBucketName = '';
							newBucketDescription = '';
						}}
						class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
