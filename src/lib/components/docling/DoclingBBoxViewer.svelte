<script lang="ts">
	import { onMount } from 'svelte';

	interface BBox {
		l: number; // left
		t: number; // top
		r: number; // right
		b: number; // bottom
	}

	interface DoclingBlock {
		type: string;
		text?: string;
		bbox?: BBox;
		[key: string]: any;
	}

	interface Props {
		imageUrl: string;
		blocks: DoclingBlock[];
		selectedBlockIndex?: number | null;
		showLabels?: boolean;
		onBlockClick?: (index: number) => void;
	}

	let {
		imageUrl,
		blocks,
		selectedBlockIndex = $bindable(null),
		showLabels = $bindable(true),
		onBlockClick
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let image: HTMLImageElement | null = null;
	let scale = 1;

	// Color scheme for different block types
	const colorMap: Record<string, string> = {
		'text': '#3B82F6',        // blue
		'title': '#8B5CF6',       // purple
		'heading': '#6366F1',     // indigo
		'paragraph': '#3B82F6',   // blue
		'list': '#10B981',        // green
		'table': '#F59E0B',       // amber
		'figure': '#EC4899',      // pink
		'caption': '#14B8A6',     // teal
		'formula': '#F97316',     // orange
		'footnote': '#6B7280',    // gray
		'page_header': '#84CC16', // lime
		'page_footer': '#06B6D4', // cyan
		'code': '#EF4444',        // red
		'default': '#64748B'      // slate
	};

	function getBlockColor(type: string): string {
		return colorMap[type.toLowerCase()] || colorMap['default'];
	}

	function drawBBoxes() {
		if (!ctx || !image || !canvas) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw image
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

		// Draw bounding boxes
		blocks.forEach((block, index) => {
			if (!block.bbox || !ctx) return;

			const bbox = block.bbox;
			const x = bbox.l * scale;
			const y = bbox.t * scale;
			const width = (bbox.r - bbox.l) * scale;
			const height = (bbox.b - bbox.t) * scale;

			const color = getBlockColor(block.type);
			const isSelected = index === selectedBlockIndex;

			// Draw rectangle
			ctx.strokeStyle = color;
			ctx.lineWidth = isSelected ? 3 : 2;
			ctx.globalAlpha = 0.8;
			ctx.strokeRect(x, y, width, height);

			// Fill with semi-transparent color
			ctx.fillStyle = color;
			ctx.globalAlpha = isSelected ? 0.3 : 0.15;
			ctx.fillRect(x, y, width, height);

			// Draw label if enabled
			if (showLabels) {
				ctx.globalAlpha = 1;
				ctx.fillStyle = color;
				const labelText = `${block.type} #${index}`;
				const padding = 4;
				const fontSize = 12;
				ctx.font = `${fontSize}px sans-serif`;
				const textWidth = ctx.measureText(labelText).width;

				// Label background
				ctx.fillRect(x, y - fontSize - padding * 2, textWidth + padding * 2, fontSize + padding * 2);

				// Label text
				ctx.fillStyle = 'white';
				ctx.fillText(labelText, x + padding, y - padding);
			}
		});

		ctx.globalAlpha = 1;
	}

	function handleCanvasClick(event: MouseEvent) {
		if (!canvas || !image) return;

		const rect = canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left) / scale;
		const y = (event.clientY - rect.top) / scale;

		// Find clicked block (reverse order to prioritize top blocks)
		for (let i = blocks.length - 1; i >= 0; i--) {
			const block = blocks[i];
			if (!block.bbox) continue;

			const bbox = block.bbox;
			if (x >= bbox.l && x <= bbox.r && y >= bbox.t && y <= bbox.b) {
				selectedBlockIndex = i;
				if (onBlockClick) onBlockClick(i);
				drawBBoxes();
				return;
			}
		}

		// Click outside any block - deselect
		selectedBlockIndex = null;
		drawBBoxes();
	}

	function loadImage() {
		if (!canvas) return;

		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			image = img;
			canvas.width = img.width;
			canvas.height = img.height;
			scale = canvas.width / img.width;
			ctx = canvas.getContext('2d');
			drawBBoxes();
		};

		img.onerror = () => {
			console.error('Failed to load image:', imageUrl);
		};

		img.src = imageUrl;
	}

	onMount(() => {
		loadImage();
	});

	$effect(() => {
		// Redraw when blocks, selectedBlockIndex, or showLabels change
		if (image) {
			drawBBoxes();
		}
	});

	$effect(() => {
		// Reload image when URL changes
		if (imageUrl) {
			loadImage();
		}
	});
</script>

<div class="relative w-full h-full bg-gray-100 overflow-auto">
	<canvas
		bind:this={canvas}
		onclick={handleCanvasClick}
		class="cursor-pointer max-w-full"
	></canvas>
</div>

<style>
	canvas {
		display: block;
		image-rendering: crisp-edges;
	}
</style>
