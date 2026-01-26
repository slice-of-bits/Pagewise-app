<script lang="ts">
	import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-svelte';

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

	interface Props {
		blocks: DoclingBlock[];
		selectedBlockIndex?: number | null;
		blockTypes: string[];
		onBlocksChange: (blocks: DoclingBlock[]) => void;
		onBlockSelect?: (index: number) => void;
	}

	let {
		blocks = $bindable([]),
		selectedBlockIndex = $bindable(null),
		blockTypes = [],
		onBlocksChange,
		onBlockSelect
	}: Props = $props();

	let expandedBlocks = $state<Set<number>>(new Set());

	function updateBlock(index: number, updates: Partial<DoclingBlock>) {
		const newBlocks = [...blocks];
		newBlocks[index] = { ...newBlocks[index], ...updates };
		blocks = newBlocks;
		onBlocksChange(newBlocks);
	}

	function updateBBox(index: number, key: keyof BBox, value: number) {
		const newBlocks = [...blocks];
		const block = newBlocks[index];
		if (block.bbox) {
			block.bbox = { ...block.bbox, [key]: value };
			blocks = newBlocks;
			onBlocksChange(newBlocks);
		}
	}

	function deleteBlock(index: number) {
		const newBlocks = blocks.filter((_, i) => i !== index);
		blocks = newBlocks;
		if (selectedBlockIndex === index) {
			selectedBlockIndex = null;
		} else if (selectedBlockIndex !== null && selectedBlockIndex > index) {
			selectedBlockIndex--;
		}
		onBlocksChange(newBlocks);
	}

	function addBlock() {
		const newBlock: DoclingBlock = {
			type: 'text',
			text: '',
			bbox: { l: 0, t: 0, r: 100, b: 100 }
		};
		const newBlocks = [...blocks, newBlock];
		blocks = newBlocks;
		selectedBlockIndex = newBlocks.length - 1;
		expandedBlocks.add(newBlocks.length - 1);
		onBlocksChange(newBlocks);
	}

	function toggleExpanded(index: number) {
		const newSet = new Set(expandedBlocks);
		if (newSet.has(index)) {
			newSet.delete(index);
		} else {
			newSet.add(index);
		}
		expandedBlocks = newSet;
	}

	function handleBlockClick(index: number) {
		selectedBlockIndex = index;
		if (onBlockSelect) onBlockSelect(index);

		// Auto-expand selected block
		const newSet = new Set(expandedBlocks);
		newSet.add(index);
		expandedBlocks = newSet;
	}

	function moveBlock(index: number, direction: 'up' | 'down') {
		if (direction === 'up' && index > 0) {
			const newBlocks = [...blocks];
			[newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
			blocks = newBlocks;
			if (selectedBlockIndex === index) selectedBlockIndex = index - 1;
			else if (selectedBlockIndex === index - 1) selectedBlockIndex = index;
			onBlocksChange(newBlocks);
		} else if (direction === 'down' && index < blocks.length - 1) {
			const newBlocks = [...blocks];
			[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
			blocks = newBlocks;
			if (selectedBlockIndex === index) selectedBlockIndex = index + 1;
			else if (selectedBlockIndex === index + 1) selectedBlockIndex = index;
			onBlocksChange(newBlocks);
		}
	}
</script>

<div class="flex flex-col h-full bg-white">
	<div class="flex items-center justify-between p-4 border-b border-gray-200">
		<h3 class="text-lg font-medium text-gray-900">Content Blocks</h3>
		<button
			onclick={addBlock}
			class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center space-x-1"
		>
			<Plus class="h-4 w-4" />
			<span>Add Block</span>
		</button>
	</div>

	<div class="flex-1 overflow-y-auto p-4 space-y-3">
		{#each blocks as block, index (index)}
			<div
				class="border rounded-lg transition-all {selectedBlockIndex === index
					? 'border-blue-500 shadow-md'
					: 'border-gray-200 hover:border-gray-300'}"
			>
				<div
					role="button"
					tabindex="0"
					class="w-full flex items-center justify-between p-3 cursor-pointer bg-gray-50 hover:bg-gray-100"
					onclick={() => handleBlockClick(index)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleBlockClick(index);
						}
					}}
				>
					<div class="flex items-center space-x-2 flex-1">
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								toggleExpanded(index);
							}}
							class="text-gray-500 hover:text-gray-700"
							aria-label={expandedBlocks.has(index) ? 'Collapse block' : 'Expand block'}
						>
							{#if expandedBlocks.has(index)}
								<ChevronDown class="h-4 w-4" />
							{:else}
								<ChevronUp class="h-4 w-4" />
							{/if}
						</button>
						<span class="font-medium text-sm text-gray-700">Block #{index}</span>
						<span
							class="px-2 py-0.5 text-xs font-medium rounded {selectedBlockIndex === index
								? 'bg-blue-100 text-blue-800'
								: 'bg-gray-200 text-gray-700'}"
						>
							{block.type}
						</span>
					</div>

					<div class="flex items-center space-x-1">
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								moveBlock(index, 'up');
							}}
							disabled={index === 0}
							class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
							title="Move up"
							aria-label="Move block up"
						>
							<ChevronUp class="h-4 w-4" />
						</button>
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								moveBlock(index, 'down');
							}}
							disabled={index === blocks.length - 1}
							class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
							title="Move down"
							aria-label="Move block down"
						>
							<ChevronDown class="h-4 w-4" />
						</button>
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								deleteBlock(index);
							}}
							class="p-1 text-red-400 hover:text-red-600"
							title="Delete block"
							aria-label="Delete block"
						>
							<Trash2 class="h-4 w-4" />
						</button>
					</div>
				</div>

				{#if expandedBlocks.has(index)}
					<div class="p-4 space-y-3 border-t border-gray-200">
						<!-- Type Selection -->
						<div>
							<label for="block-type-{index}" class="block text-xs font-medium text-gray-700 mb-1">Block Type</label>
							<select
								id="block-type-{index}"
								value={block.type}
								onchange={(e) => updateBlock(index, { type: e.currentTarget.value })}
								class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								{#each blockTypes as type}
									<option value={type}>{type}</option>
								{/each}
							</select>
						</div>

						<!-- Text Content -->
						<div>
							<label for="block-text-{index}" class="block text-xs font-medium text-gray-700 mb-1">Content</label>
							<textarea
								id="block-text-{index}"
								value={block.text || ''}
								oninput={(e) => updateBlock(index, { text: e.currentTarget.value })}
								rows="3"
								class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
								placeholder="Block content..."
							></textarea>
						</div>

						<!-- BBox Coordinates -->
						{#if block.bbox}
							<div>
								<div class="block text-xs font-medium text-gray-700 mb-2">
									Bounding Box
								</div>
								<div class="grid grid-cols-2 gap-2">
									<div>
										<label for="bbox-l-{index}" class="block text-xs text-gray-600 mb-1">Left (x1)</label>
										<input
											id="bbox-l-{index}"
											type="number"
											value={block.bbox.l}
											oninput={(e) => updateBBox(index, 'l', parseFloat(e.currentTarget.value))}
											step="0.1"
											class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label for="bbox-t-{index}" class="block text-xs text-gray-600 mb-1">Top (y1)</label>
										<input
											id="bbox-t-{index}"
											type="number"
											value={block.bbox.t}
											oninput={(e) => updateBBox(index, 't', parseFloat(e.currentTarget.value))}
											step="0.1"
											class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label for="bbox-r-{index}" class="block text-xs text-gray-600 mb-1">Right (x2)</label>
										<input
											id="bbox-r-{index}"
											type="number"
											value={block.bbox.r}
											oninput={(e) => updateBBox(index, 'r', parseFloat(e.currentTarget.value))}
											step="0.1"
											class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									</div>
									<div>
										<label for="bbox-b-{index}" class="block text-xs text-gray-600 mb-1">Bottom (y2)</label>
										<input
											id="bbox-b-{index}"
											type="number"
											value={block.bbox.b}
											oninput={(e) => updateBBox(index, 'b', parseFloat(e.currentTarget.value))}
											step="0.1"
											class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									</div>
								</div>
							</div>
						{/if}

						<!-- Preview of content -->
						{#if block.text}
							<div>
								<div class="block text-xs font-medium text-gray-700 mb-1">Preview</div>
								<div class="p-2 bg-gray-50 rounded text-xs text-gray-600 max-h-20 overflow-y-auto">
									{block.text.substring(0, 150)}{block.text.length > 150 ? '...' : ''}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center py-8 text-gray-500">
				<p class="text-sm">No blocks available</p>
				<p class="text-xs mt-1">Click "Add Block" to create a new content block</p>
			</div>
		{/each}
	</div>

	<div class="p-4 border-t border-gray-200 bg-gray-50">
		<p class="text-xs text-gray-600">
			Total blocks: {blocks.length}
			{#if selectedBlockIndex !== null}
				• Selected: Block #{selectedBlockIndex}
			{/if}
		</p>
	</div>
</div>
