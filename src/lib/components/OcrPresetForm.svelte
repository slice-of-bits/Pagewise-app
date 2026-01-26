<script lang="ts">
	import type { OcrPresetSchema, OcrPresetCreateSchema } from '$lib/api';

	interface Props {
		preset?: OcrPresetSchema;
		onSubmit: (data: OcrPresetCreateSchema) => void | Promise<void>;
		onCancel?: () => void;
		isSubmitting?: boolean;
		submitLabel?: string;
	}

	let { preset, onSubmit, onCancel, isSubmitting = false, submitLabel = 'Save' }: Props = $props();

	let name = $state('');
	let forceOcr = $state(false);
	let skipText = $state(false);
	let redoOcr = $state(false);
	let ocrBackend = $state('tesseract');
	let language = $state('eng');
	let optimize = $state(0);
	let jpegQuality = $state(0);
	let pngQuality = $state(0);
	let deskew = $state(false);
	let clean = $state(false);
	let cleanFinal = $state(false);
	let removeBackground = $state(false);
	let oversample = $state(0);
	let rotatePages = $state(false);
	let removeVectors = $state(false);

	// Initialize form values from preset when it changes
	$effect(() => {
		if (preset) {
			name = preset.name;
			forceOcr = preset.force_ocr;
			skipText = preset.skip_text;
			redoOcr = preset.redo_ocr;
			ocrBackend = preset.ocr_backend;
			language = preset.language;
			optimize = preset.optimize;
			jpegQuality = preset.jpeg_quality;
			pngQuality = preset.png_quality;
			deskew = preset.deskew;
			clean = preset.clean;
			cleanFinal = preset.clean_final;
			removeBackground = preset.remove_background;
			oversample = preset.oversample;
			rotatePages = preset.rotate_pages;
			removeVectors = preset.remove_vectors;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		const data: OcrPresetCreateSchema = {
			name: name.trim(),
			force_ocr: forceOcr,
			skip_text: skipText,
			redo_ocr: redoOcr,
			ocr_backend: ocrBackend || undefined,
			language: language || undefined,
			optimize: optimize || undefined,
			jpeg_quality: jpegQuality || undefined,
			png_quality: pngQuality || undefined,
			deskew: deskew,
			clean: clean,
			clean_final: cleanFinal,
			remove_background: removeBackground,
			oversample: oversample || undefined,
			rotate_pages: rotatePages,
			remove_vectors: removeVectors
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
				<label for="ocr_backend" class="block text-sm font-medium text-gray-700 mb-1">
					OCR Backend
				</label>
				<select
					id="ocr_backend"
					bind:value={ocrBackend}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="tesseract">Tesseract</option>
					<option value="easyocr">EasyOCR</option>
				</select>
				<p class="mt-1 text-sm text-gray-500">
					Choose the OCR engine backend
				</p>
			</div>

			<div>
				<label for="language" class="block text-sm font-medium text-gray-700 mb-1">
					Language
				</label>
				<input
					type="text"
					id="language"
					bind:value={language}
					placeholder="e.g., eng, fra, deu"
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				/>
				<p class="mt-1 text-sm text-gray-500">
					Tesseract language code (e.g., eng for English, fra for French)
				</p>
			</div>
		</div>
	</div>

	<!-- OCR Behavior -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">OCR Behavior</h3>

		<div class="space-y-4">
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
					Force OCR even if the PDF already contains text
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={skipText}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Skip Text</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Skip OCR on pages that already contain text
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={redoOcr}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Redo OCR</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Redo OCR on pages that already contain text
				</p>
			</div>
		</div>
	</div>

	<!-- Optimization Settings -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">Optimization Settings</h3>

		<div class="space-y-4">
			<div>
				<label for="optimize" class="block text-sm font-medium text-gray-700 mb-1">
					Optimize Level
				</label>
				<select
					id="optimize"
					bind:value={optimize}
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				>
					<option value={0}>0 - No optimization</option>
					<option value={1}>1 - Lossless optimization</option>
					<option value={2}>2 - Lossy optimization</option>
					<option value={3}>3 - Aggressive lossy optimization</option>
				</select>
				<p class="mt-1 text-sm text-gray-500">
					Higher levels reduce file size but may reduce quality
				</p>
			</div>

			<div>
				<label for="jpeg_quality" class="block text-sm font-medium text-gray-700 mb-1">
					JPEG Quality (0-100)
				</label>
				<input
					type="number"
					id="jpeg_quality"
					bind:value={jpegQuality}
					min="0"
					max="100"
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				/>
				<p class="mt-1 text-sm text-gray-500">
					0 = use default, higher = better quality
				</p>
			</div>

			<div>
				<label for="png_quality" class="block text-sm font-medium text-gray-700 mb-1">
					PNG Quality (0-100)
				</label>
				<input
					type="number"
					id="png_quality"
					bind:value={pngQuality}
					min="0"
					max="100"
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				/>
				<p class="mt-1 text-sm text-gray-500">
					0 = use default, higher = better quality
				</p>
			</div>
		</div>
	</div>

	<!-- Image Processing -->
	<div class="bg-white rounded-lg border border-gray-200 p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">Image Processing</h3>

		<div class="space-y-4">
			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={deskew}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Deskew</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Correct page rotation and skew
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={clean}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Clean</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Clean pages before OCR
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={cleanFinal}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Clean Final</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Clean pages after OCR
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={removeBackground}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Remove Background</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Remove background noise from images
				</p>
			</div>

			<div>
				<label for="oversample" class="block text-sm font-medium text-gray-700 mb-1">
					Oversample (DPI)
				</label>
				<input
					type="number"
					id="oversample"
					bind:value={oversample}
					min="0"
					max="600"
					class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
				/>
				<p class="mt-1 text-sm text-gray-500">
					0 = use default (300 DPI), oversample low quality images
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={rotatePages}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Rotate Pages</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Automatically rotate pages to correct orientation
				</p>
			</div>

			<div>
				<label class="flex items-center space-x-2">
					<input
						type="checkbox"
						bind:checked={removeVectors}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
					/>
					<span class="text-sm font-medium text-gray-700">Remove Vectors</span>
				</label>
				<p class="mt-1 text-sm text-gray-500 ml-6">
					Remove vector graphics to reduce file size
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
