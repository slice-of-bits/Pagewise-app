<script lang="ts">
	import type { DoclingPresetSchema, DoclingPresetCreateSchema } from '$lib/api';

	interface Props {
		preset?: DoclingPresetSchema;
		onSubmit: (data: DoclingPresetCreateSchema) => void | Promise<void>;
		onCancel?: () => void;
		isSubmitting?: boolean;
		submitLabel?: string;
	}

	let { preset, onSubmit, onCancel, isSubmitting = false, submitLabel = 'Save' }: Props = $props();

	let name = $state('');
	let pipelineType = $state('standard');
	let ocrEngine = $state('easyocr');
	let forceOcr = $state(false);
	let ocrLanguages = $state('en');
	let vlmModel = $state('');
	let enablePictureDescription = $state(true);
	let pictureDescriptionPrompt = $state('Describe this image in detail');
	let enableTableStructure = $state(true);
	let tableFormerMode = $state('fast');
	let enableCodeEnrichment = $state(false);
	let enableFormulaEnrichment = $state(false);
	let filterOrphanClusters = $state(true);
	let filterEmptyClusters = $state(true);

	// Initialize form values from preset when it changes
	$effect(() => {
		if (preset) {
			name = preset.name;
			pipelineType = preset.pipeline_type;
			ocrEngine = preset.ocr_engine;
			forceOcr = preset.force_ocr;
			ocrLanguages = preset.ocr_languages.join(', ');
			vlmModel = preset.vlm_model || '';
			enablePictureDescription = preset.enable_picture_description;
			pictureDescriptionPrompt = preset.picture_description_prompt;
			enableTableStructure = preset.enable_table_structure;
			tableFormerMode = preset.table_former_mode;
			enableCodeEnrichment = preset.enable_code_enrichment;
			enableFormulaEnrichment = preset.enable_formula_enrichment;
			filterOrphanClusters = preset.filter_orphan_clusters;
			filterEmptyClusters = preset.filter_empty_clusters;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		const data: DoclingPresetCreateSchema = {
			name: name.trim(),
			pipeline_type: pipelineType || null,
			ocr_engine: ocrEngine || null,
			force_ocr: forceOcr,
			ocr_languages: ocrLanguages ? ocrLanguages.split(',').map(l => l.trim()).filter(Boolean) : null,
			vlm_model: vlmModel.trim() || null,
			enable_picture_description: enablePictureDescription,
			picture_description_prompt: pictureDescriptionPrompt.trim() || null,
			enable_table_structure: enableTableStructure,
			table_former_mode: tableFormerMode || null,
			enable_code_enrichment: enableCodeEnrichment,
			enable_formula_enrichment: enableFormulaEnrichment,
			filter_orphan_clusters: filterOrphanClusters,
			filter_empty_clusters: filterEmptyClusters
		};

		await onSubmit(data);
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<!-- Basic Settings -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">Basic Settings</h3>

		<div class="space-y-4">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					Name *
				</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					placeholder="e.g., High Quality OCR"
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					required
				/>
			</div>

			<div>
				<label for="pipeline_type" class="block text-sm font-medium text-gray-700 mb-1">
					Pipeline Type
				</label>
				<select
					id="pipeline_type"
					bind:value={pipelineType}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="standard">Standard</option>
					<option value="simple">Simple</option>
				</select>
				<p class="mt-1 text-sm text-gray-500">
					Choose the processing pipeline type
				</p>
			</div>
		</div>
	</div>

	<!-- OCR Settings -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">OCR Settings</h3>

		<div class="space-y-4">
			<div>
				<label for="ocr_engine" class="block text-sm font-medium text-gray-700 mb-1">
					OCR Engine
				</label>
				<select
					id="ocr_engine"
					bind:value={ocrEngine}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="easyocr">EasyOCR</option>
					<option value="tesseract">Tesseract</option>
				</select>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={forceOcr}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Force OCR</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Force OCR even if text is extractable from PDF
				</p>
			</div>

			<div>
				<label for="ocr_languages" class="block text-sm font-medium text-gray-700 mb-1">
					OCR Languages
				</label>
				<input
					type="text"
					id="ocr_languages"
					bind:value={ocrLanguages}
					placeholder="e.g., en, fr, de"
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				/>
				<p class="mt-1 text-sm text-gray-500">
					Comma-separated language codes
				</p>
			</div>
		</div>
	</div>

	<!-- Vision Language Model Settings -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">Vision Language Model</h3>

		<div class="space-y-4">
			<div>
				<label for="vlm_model" class="block text-sm font-medium text-gray-700 mb-1">
					VLM Model
				</label>
				<input
					type="text"
					id="vlm_model"
					bind:value={vlmModel}
					placeholder="e.g., gpt-4-vision"
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				/>
				<p class="mt-1 text-sm text-gray-500">
					Leave empty to use default
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={enablePictureDescription}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Enable Picture Description</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Generate descriptions for images in the document
				</p>
			</div>

			{#if enablePictureDescription}
				<div>
					<label for="picture_description_prompt" class="block text-sm font-medium text-gray-700 mb-1">
						Picture Description Prompt
					</label>
					<textarea
						id="picture_description_prompt"
						bind:value={pictureDescriptionPrompt}
						rows="3"
						class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					></textarea>
				</div>
			{/if}
		</div>
	</div>

	<!-- Table and Content Settings -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">Table & Content Processing</h3>

		<div class="space-y-4">
			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={enableTableStructure}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Enable Table Structure</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Detect and preserve table structures
				</p>
			</div>

			{#if enableTableStructure}
				<div>
					<label for="table_former_mode" class="block text-sm font-medium text-gray-700 mb-1">
						Table Former Mode
					</label>
					<select
						id="table_former_mode"
						bind:value={tableFormerMode}
						class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="fast">Fast</option>
						<option value="accurate">Accurate</option>
					</select>
				</div>
			{/if}

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={enableCodeEnrichment}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Enable Code Enrichment</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Enhance code block detection and formatting
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={enableFormulaEnrichment}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Enable Formula Enrichment</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Enhance mathematical formula detection
				</p>
			</div>
		</div>
	</div>

	<!-- Filtering Settings -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">Content Filtering</h3>

		<div class="space-y-4">
			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={filterOrphanClusters}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Filter Orphan Clusters</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Remove isolated content clusters
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={filterEmptyClusters}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Filter Empty Clusters</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Remove empty content clusters
				</p>
			</div>
		</div>
	</div>

	<!-- Form Actions -->
	<div class="flex justify-end space-x-4">
		{#if onCancel}
			<button
				type="button"
				onclick={onCancel}
				class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
			>
				Cancel
			</button>
		{/if}

		<button
			type="submit"
			disabled={!name.trim() || isSubmitting}
			class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
		>
			{#if isSubmitting}
				<span>Saving...</span>
			{:else}
				<span>{submitLabel}</span>
			{/if}
		</button>
	</div>
</form>
