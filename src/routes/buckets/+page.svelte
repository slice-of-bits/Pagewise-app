<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { Folder, Plus, Edit, Trash2, FileText } from 'lucide-svelte';
	import { groupApiListGroups, groupApiCreateGroup, groupApiDeleteGroup } from '$lib/api/sdk.gen';

	let showCreateModal = $state(false);
	let newGroupName = $state('');
	let newGroupDescription = $state('');

	const queryClient = useQueryClient();

	// Fetch all groups
	const groupsQuery = createQuery(() => ({
		queryKey: ['groups'],
		queryFn: async () => {
			const response = await groupApiListGroups();
			return response.data || [];
		}
	}));

	// Create group mutation
	const createGroupMutation = createMutation(() => ({
		mutationFn: async ({ name, description }: { name: string; description?: string }) => {
			const response = await groupApiCreateGroup({
				body: { name, description }
			});
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['groups'] });
			showCreateModal = false;
			newGroupName = '';
			newGroupDescription = '';
		}
	}));

	// Delete group mutation
	const deleteGroupMutation = createMutation(() => ({
		mutationFn: async (groupId: string) => {
			await groupApiDeleteGroup({
				path: { sqid: groupId }
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['groups'] });
		}
	}));

	function handleCreateGroup() {
		if (newGroupName.trim()) {
			createGroupMutation.mutate({
				name: newGroupName.trim(),
				description: newGroupDescription.trim() || undefined
			});
		}
	}

	function handleDeleteGroup(groupId: string, groupName: string) {
		if (confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
			deleteGroupMutation.mutate(groupId);
		}
	}
</script>

<svelte:head>
	<title>Groups - Pagewise</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Groups</h1>
			<p class="mt-1 text-sm text-gray-600">
				Organize your documents into groups for better management
			</p>
		</div>

		<button
			onclick={() => showCreateModal = true}
			class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
		>
			<Plus class="mr-2 h-4 w-4" />
			New Group
		</button>
	</div>

	<!-- Groups Grid -->
	{#if groupsQuery.isLoading}
		<div class="text-center py-12">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<p class="mt-4 text-gray-600">Loading groups...</p>
		</div>
	{:else if groupsQuery.error}
		<div class="text-center py-12">
			<p class="text-red-600">Error loading groups. Please try again.</p>
		</div>
	{:else if Array.isArray(groupsQuery.data) && groupsQuery.data.length === 0}
		<!-- Empty State -->
		<div class="text-center py-12">
			<Folder class="mx-auto h-24 w-24 text-gray-300" />
			<h3 class="mt-4 text-lg font-medium text-gray-900">No groups yet</h3>
			<p class="mt-2 text-gray-500">
				Get started by creating your first group to organize documents.
			</p>
			<div class="mt-6">
				<button
					onclick={() => showCreateModal = true}
					class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
				>
					<Plus class="mr-2 h-4 w-4" />
					Create Group
				</button>
			</div>
		</div>
	{:else}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each (groupsQuery.data as any[]) || [] as group (group.sqid)}
				<div class="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
					<div class="flex items-start justify-between">
						<div class="flex items-center space-x-3 min-w-0 flex-1">
							<div class="flex-shrink-0">
								<Folder class="h-8 w-8 text-blue-600" />
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="text-lg font-medium text-gray-900 truncate">
									{group.name}
								</h3>
								{#if group.description}
									<p class="mt-1 text-sm text-gray-600 line-clamp-2">
										{group.description}
									</p>
								{/if}
							</div>
						</div>

						<!-- Actions -->
						<div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<button
								class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
								title="Edit group"
							>
								<Edit class="h-4 w-4" />
							</button>
							<button
								onclick={() => handleDeleteGroup(group.sqid, group.name)}
								class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
								title="Delete group"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</div>
					</div>

					<!-- Stats -->
					<div class="mt-4 flex items-center text-sm text-gray-500">
						<FileText class="mr-1 h-4 w-4" />
						{group.documents_count || 0} document{(group.documents_count || 0) !== 1 ? 's' : ''}
					</div>

					<!-- Link to view documents -->
					<a
						href={`/documents?group=${group.sqid}`}
						class="absolute inset-0 rounded-lg"
						aria-label={`View documents in ${group.name}`}
					></a>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Group Modal -->
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
								Create New Group
							</h3>
							<div class="mt-4 space-y-4">
								<div>
									<label for="group-name" class="block text-sm font-medium text-gray-700">
										Name *
									</label>
									<input
										type="text"
										id="group-name"
										bind:value={newGroupName}
										placeholder="Enter group name"
										class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
									/>
								</div>
								<div>
									<label for="group-description" class="block text-sm font-medium text-gray-700">
										Description (optional)
									</label>
									<textarea
										id="group-description"
										bind:value={newGroupDescription}
										rows={3}
										placeholder="Enter group description"
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
						onclick={handleCreateGroup}
						disabled={!newGroupName.trim() || createGroupMutation.isPending}
						class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if createGroupMutation.isPending}
							Creating...
						{:else}
							Create Group
						{/if}
					</button>
					<button
						type="button"
						onclick={() => {
							showCreateModal = false;
							newGroupName = '';
							newGroupDescription = '';
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
