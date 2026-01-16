<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import {documentsApiListDocumentsOptions} from "$lib/api/@tanstack/svelte-query.gen";

	// Query for active tasks
	const activeTasksQuery = createQuery({
        refetchInterval: 5000,
        ...documentsApiListDocumentsOptions({
            query: {
                limit: 50,
                offset: 0,
                processing_status: 'processing'
            }
        })
    });

</script>

{#if $activeTasksQuery.isSuccess && $activeTasksQuery.data.count > 0}
	<div class="bg-blue-50 border-b border-blue-200">
		<div class="container mx-auto px-4 py-2">
			<div class="space-y-2">
				{#each $activeTasksQuery.data.items as document}
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div class="text-sm font-medium text-blue-900">
								{document.title}
							</div>
						</div>

						<div class="flex items-center space-x-3">
							<div class="w-32 bg-blue-200 rounded-full h-2 overflow-hidden">
								<div
									class="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
									style="width: {document.processing_progress}%"
								></div>
							</div>
							<div class="text-xs font-medium text-blue-700 min-w-12 text-right">
								{Number(document.processing_progress).toFixed(2)}%
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

