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

	let {
		page,
		blocks,
		selectedBlockIndex = $bindable(null),
		showLabels = $bindable(true),
		onBlockClick = undefined
	}: {
		page: any;
		blocks: any[];
		selectedBlockIndex?: number | null;
		showLabels?: boolean;
		onBlockClick?: (index: number) => void;
	} = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let image: HTMLImageElement | null = null;
	let scale = 1;

	// Color scheme for different block types
	const colorMap: Record<string, string> = {
		'text': '#3B82F6',          // blue
		'section_header': '#9333EA', // purple-600
		'title': '#8B5CF6',         // purple
		'heading': '#6366F1',       // indigo
		'paragraph': '#3B82F6',     // blue
		'list': '#10B981',          // green
		'list_item': '#059669',     // green-600
		'table': '#F59E0B',         // amber
		'figure': '#EC4899',        // pink
		'picture': '#DB2777',       // pink-600
		'caption': '#14B8A6',       // teal
		'formula': '#F97316',       // orange
		'footnote': '#6B7280',      // gray
		'page_header': '#84CC16',   // lime
		'page_footer': '#06B6D4',   // cyan
		'code': '#EF4444',          // red
		'default': '#64748B'        // slate
	};

	function getBlockColor(type: string): string {
		return colorMap[type.toLowerCase()] || colorMap['default'];
	}

	function drawBBoxes() {
		if (!ctx || !image || !canvas) {
			console.warn('DoclingBBoxViewer: Cannot draw - missing ctx, image, or canvas');
			return;
		}

		// Get the Docling page dimensions
		// The bbox coordinates are in Docling page units, not pixels
		let doclingPageWidth = canvas.width;
		let doclingPageHeight = canvas.height;

		// Try to get exact page dimensions from the page prop
		// Docling stores page size in the pages object
		if (page?.docling_json?.pages) {
			const pageData = Object.values(page.docling_json.pages)[0] as any;
			if (pageData?.size) {
				doclingPageWidth = pageData.size.width;
				doclingPageHeight = pageData.size.height;
				console.log('DoclingBBoxViewer: Got page size from docling_json', {
					width: doclingPageWidth,
					height: doclingPageHeight
				});
			}
		}

		// If we still don't have page dimensions, calculate from bbox data
		// Use ALL bbox coordinates (including top/bottom, left/right) to find actual page bounds
		if (doclingPageWidth === canvas.width && blocks.length > 0) {
			let maxBboxR = 0;
			let maxBboxT = 0; // For BOTTOMLEFT origin, T is at top (higher value)

			blocks.forEach((block: any) => {
				if (block.bbox) {
					maxBboxR = Math.max(maxBboxR, block.bbox.r);
					maxBboxT = Math.max(maxBboxT, block.bbox.t); // Top edge in BOTTOMLEFT
				}
			});

			// Add some padding (10%) to account for margins
			if (maxBboxR > 0 && maxBboxT > 0) {
				doclingPageWidth = maxBboxR * 1.1;
				doclingPageHeight = maxBboxT * 1.1;
				console.log('DoclingBBoxViewer: Calculated page size from bbox data with 10% padding', {
					maxRight: maxBboxR,
					maxTop: maxBboxT,
					pageWidth: doclingPageWidth,
					pageHeight: doclingPageHeight
				});
			}
		}

		console.log('DoclingBBoxViewer: Drawing bboxes', {
			imageSize: { width: image.width, height: image.height },
			canvasSize: { width: canvas.width, height: canvas.height },
			blocksCount: blocks.length,
			doclingPageSize: { width: doclingPageWidth, height: doclingPageHeight }
		});

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw image
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

		// Calculate scale factor from Docling page units to canvas pixels
		const scaleX = canvas.width / doclingPageWidth;
		const scaleY = canvas.height / doclingPageHeight;

		console.log('DoclingBBoxViewer: Coordinate scaling', {
			doclingPageSize: { width: doclingPageWidth, height: doclingPageHeight },
			canvasSize: { width: canvas.width, height: canvas.height },
			scale: { x: scaleX, y: scaleY }
		});

		// Draw bounding boxes
		blocks.forEach((block: any, index: number) => {
			if (!block.bbox || !ctx) return;

			const bbox = block.bbox;

			// Check if coordinates use BOTTOMLEFT origin (Docling default)
			const coordOrigin = block.prov?.[0]?.bbox?.coord_origin || 'BOTTOMLEFT';
			let x, y, width, height;

			if (coordOrigin === 'BOTTOMLEFT') {
				// Convert from BOTTOMLEFT to TOPLEFT and scale to canvas pixels
				x = bbox.l * scaleX;
				y = canvas.height - (bbox.b * scaleY); // Flip Y coordinate
				width = (bbox.r - bbox.l) * scaleX;
				height = (bbox.b - bbox.t) * scaleY;
			} else {
				// TOPLEFT origin - just scale
				x = bbox.l * scaleX;
				y = bbox.t * scaleY;
				width = (bbox.r - bbox.l) * scaleX;
				height = (bbox.b - bbox.t) * scaleY;
			}

			if (index < 3) { // Only log first 3 blocks to avoid console spam
				console.log(`Block ${index} (${block.type}):`, {
					bbox: bbox,
					coordOrigin: coordOrigin,
					canvasCoords: { x, y, width, height },
					scales: { x: scaleX, y: scaleY }
				});
			}

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
		console.log('DoclingBBoxViewer: Drawing complete');
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
		if (!canvas) {
			console.warn('DoclingBBoxViewer: Canvas not ready yet');
			return;
		}

		// Check if page_image is available
		if (!page?.page_image) {
			console.warn('DoclingBBoxViewer: No page_image available. Page data:', {
				sqid: page?.sqid,
				page_number: page?.page_number,
				page_image: page?.page_image,
				page_pdf: page?.page_pdf
			});
			return;
		}

		console.log('DoclingBBoxViewer: Starting image load', {
			url: page.page_image,
			canvasReady: !!canvas,
			blocksCount: blocks.length
		});

		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			console.log('DoclingBBoxViewer: Image loaded successfully', {
				width: img.width,
				height: img.height
			});

			image = img;
			canvas.width = img.width;
			canvas.height = img.height;
			scale = 1; // Use 1:1 scale since we're setting canvas to match image
			ctx = canvas.getContext('2d');

			if (!ctx) {
				console.error('DoclingBBoxViewer: Failed to get canvas 2d context');
				return;
			}

			console.log('DoclingBBoxViewer: Canvas configured', {
				canvasWidth: canvas.width,
				canvasHeight: canvas.height,
				scale: scale,
				hasContext: !!ctx
			});

			drawBBoxes();
		};

		img.onerror = (error) => {
			console.error('DoclingBBoxViewer: Failed to load image:', {
				url: page.page_image,
				error: error,
				page: page
			});
		};

		console.log('DoclingBBoxViewer: Loading image from:', page.page_image);
		img.src = page.page_image;
	}

	onMount(() => {
		if (page?.page_image) {
			loadImage();
		}
	});

	$effect(() => {
		// Redraw when blocks, selectedBlockIndex, or showLabels change
		if (image && canvas && ctx) {
			drawBBoxes();
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
