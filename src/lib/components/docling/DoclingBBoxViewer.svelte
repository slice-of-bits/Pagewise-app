<script lang="ts">
	import { onMount } from 'svelte';

	interface BBox {
		l: number; // left
		t: number; // top
		r: number; // right
		b: number; // bottom
	}

	let {
		page,
		blocks,
		selectedBlockIndex = $bindable(null),
		showLabels = $bindable(true),
		isAddingBlock = $bindable(false),
		updateTrigger = 0,
		onBlockClick = undefined,
		onBBoxDrawn = undefined,
		onBBoxUpdate = undefined
	}: {
		page: any;
		blocks: any[];
		selectedBlockIndex?: number | null;
		showLabels?: boolean;
		isAddingBlock?: boolean;
		updateTrigger?: number;
		onBlockClick?: (index: number) => void;
		onBBoxDrawn?: (bbox: BBox) => void;
		onBBoxUpdate?: (index: number, bbox: BBox) => void;
	} = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let image: HTMLImageElement | null = null;
	let scale = 1;

	// Drawing state
	let isDrawing = $state(false);
	let drawStartX = $state(0);
	let drawStartY = $state(0);
	let drawCurrentX = $state(0);
	let drawCurrentY = $state(0);

	// Dragging state
	let isDragging = $state(false);
	let draggedCorner = $state<string | null>(null);
	let draggedBlockIndex = $state<number | null>(null);

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
		let doclingPageWidth = canvas.width;
		let doclingPageHeight = canvas.height;

		// Try to get exact page dimensions from the page prop
		if (page?.docling_json?.pages) {
			const pageData = Object.values(page.docling_json.pages)[0] as any;
			if (pageData?.size) {
				doclingPageWidth = pageData.size.width;
				doclingPageHeight = pageData.size.height;
			}
		}

		// If we still don't have page dimensions, calculate from bbox data
		if (doclingPageWidth === canvas.width && blocks.length > 0) {
			let maxBboxR = 0;
			let maxBboxT = 0;

			blocks.forEach((block: any) => {
				if (block.bbox) {
					maxBboxR = Math.max(maxBboxR, block.bbox.r);
					maxBboxT = Math.max(maxBboxT, block.bbox.t);
				}
			});

			if (maxBboxR > 0 && maxBboxT > 0) {
				doclingPageWidth = maxBboxR * 1.1;
				doclingPageHeight = maxBboxT * 1.1;
			}
		}

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw image
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

		// Calculate scale factor from Docling page units to canvas pixels
		const scaleX = canvas.width / doclingPageWidth;
		const scaleY = canvas.height / doclingPageHeight;

		// Draw bounding boxes
		blocks.forEach((block: any, index: number) => {
			if (!block.bbox || !ctx) return;

			const bbox = block.bbox;
			const coordOrigin = block.prov?.[0]?.bbox?.coord_origin || 'BOTTOMLEFT';
			let x, y, width, height;

			if (coordOrigin === 'BOTTOMLEFT') {
				x = bbox.l * scaleX;
				y = canvas.height - (bbox.b * scaleY);
				width = (bbox.r - bbox.l) * scaleX;
				height = (bbox.b - bbox.t) * scaleY;
			} else {
				x = bbox.l * scaleX;
				y = bbox.t * scaleY;
				width = (bbox.r - bbox.l) * scaleX;
				height = (bbox.b - bbox.t) * scaleY;
			}

			const color = getBlockColor(block.type);
			const isSelected = index === selectedBlockIndex;

			// Draw rectangle with better visibility for selected
			ctx.strokeStyle = color;
			ctx.lineWidth = isSelected ? 4 : 2;
			ctx.globalAlpha = 1;
			ctx.strokeRect(x, y, width, height);

			// Fill with semi-transparent color - more visible when selected
			ctx.fillStyle = color;
			ctx.globalAlpha = isSelected ? 0.3 : 0.1;
			ctx.fillRect(x, y, width, height);

			// Add a second highlight border for selected blocks
			if (isSelected) {
				ctx.strokeStyle = '#3B82F6'; // Blue highlight
				ctx.lineWidth = 2;
				ctx.globalAlpha = 0.8;
				const offset = 3;
				ctx.strokeRect(x - offset, y - offset, width + offset * 2, height + offset * 2);
			}

			// Draw corner handles for selected block
			if (isSelected) {
				ctx.globalAlpha = 1;
				ctx.fillStyle = color;
				const handleSize = 8;
				// Top-left
				ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
				// Top-right
				ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
				// Bottom-left
				ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
				// Bottom-right
				ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
			}

			// Draw label OUTSIDE the box (above it) if enabled
			if (showLabels) {
				ctx.globalAlpha = 1;
				const labelText = `${block.type} #${index}`;
				const padding = 4;
				const fontSize = 12;
				ctx.font = `${fontSize}px sans-serif`;
				const textWidth = ctx.measureText(labelText).width;

				const labelHeight = fontSize + padding * 2;

				// Position label ABOVE the box with clearance
				const labelX = x;
				const labelY = y - labelHeight - 2; // 2px gap from box

				// Label background
				ctx.fillStyle = color;
				ctx.fillRect(labelX, labelY, textWidth + padding * 2, labelHeight);

				// Label text
				ctx.fillStyle = 'white';
				ctx.fillText(labelText, labelX + padding, labelY + fontSize + padding / 2);
			}
		});

		// Draw the box being drawn
		if (isDrawing && isAddingBlock) {
			ctx.globalAlpha = 1;
			ctx.strokeStyle = '#3B82F6';
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			const drawX = Math.min(drawStartX, drawCurrentX);
			const drawY = Math.min(drawStartY, drawCurrentY);
			const drawWidth = Math.abs(drawCurrentX - drawStartX);
			const drawHeight = Math.abs(drawCurrentY - drawStartY);
			ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
			ctx.setLineDash([]);
		}

		ctx.globalAlpha = 1;
	}

	function getCanvasCoordinates(event: MouseEvent): {x: number, y: number} {
		if (!canvas) return {x: 0, y: 0};
		const rect = canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}

	function canvasToDocling(canvasX: number, canvasY: number): {x: number, y: number} {
		if (!canvas || !page?.docling_json?.pages) return {x: canvasX, y: canvasY};

		const pageData = Object.values(page.docling_json.pages)[0] as any;
		const doclingPageWidth = pageData?.size?.width || canvas.width;
		const doclingPageHeight = pageData?.size?.height || canvas.height;

		const scaleX = canvas.width / doclingPageWidth;
		const scaleY = canvas.height / doclingPageHeight;

		// Convert to Docling coordinates (BOTTOMLEFT origin)
		return {
			x: canvasX / scaleX,
			y: (canvas.height - canvasY) / scaleY
		};
	}

	function getCornerAtPosition(canvasX: number, canvasY: number, blockIndex: number): string | null {
		const block = blocks[blockIndex];
		if (!block?.bbox || !canvas || !page?.docling_json?.pages) return null;

		const pageData = Object.values(page.docling_json.pages)[0] as any;
		const doclingPageWidth = pageData?.size?.width || canvas.width;
		const doclingPageHeight = pageData?.size?.height || canvas.height;
		const scaleX = canvas.width / doclingPageWidth;
		const scaleY = canvas.height / doclingPageHeight;

		const bbox = block.bbox;
		const x = bbox.l * scaleX;
		const y = canvas.height - (bbox.b * scaleY);
		const width = (bbox.r - bbox.l) * scaleX;
		const height = (bbox.b - bbox.t) * scaleY;

		const handleSize = 12;

		// Check each corner
		if (Math.abs(canvasX - x) < handleSize && Math.abs(canvasY - y) < handleSize) return 'tl';
		if (Math.abs(canvasX - (x + width)) < handleSize && Math.abs(canvasY - y) < handleSize) return 'tr';
		if (Math.abs(canvasX - x) < handleSize && Math.abs(canvasY - (y + height)) < handleSize) return 'bl';
		if (Math.abs(canvasX - (x + width)) < handleSize && Math.abs(canvasY - (y + height)) < handleSize) return 'br';

		return null;
	}

	function handleMouseDown(event: MouseEvent) {
		const {x, y} = getCanvasCoordinates(event);

		// Check if we're in adding mode
		if (isAddingBlock) {
			isDrawing = true;
			drawStartX = x;
			drawStartY = y;
			drawCurrentX = x;
			drawCurrentY = y;
			return;
		}

		// Check if clicking on a corner of selected block
		if (selectedBlockIndex !== null) {
			const corner = getCornerAtPosition(x, y, selectedBlockIndex);
			if (corner) {
				isDragging = true;
				draggedCorner = corner;
				draggedBlockIndex = selectedBlockIndex;
				return;
			}
		}

		// Check if clicking on a block
		const pageData = page?.docling_json?.pages ? Object.values(page.docling_json.pages)[0] as any : null;
		const doclingPageWidth = pageData?.size?.width || canvas.width;
		const doclingPageHeight = pageData?.size?.height || canvas.height;
		const scaleX = canvas.width / doclingPageWidth;
		const scaleY = canvas.height / doclingPageHeight;

		for (let i = blocks.length - 1; i >= 0; i--) {
			const block = blocks[i];
			if (!block.bbox) continue;

			const bbox = block.bbox;
			const bx = bbox.l * scaleX;
			const by = canvas.height - (bbox.b * scaleY);
			const bwidth = (bbox.r - bbox.l) * scaleX;
			const bheight = (bbox.b - bbox.t) * scaleY;

			if (x >= bx && x <= bx + bwidth && y >= by && y <= by + bheight) {
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

	function handleMouseMove(event: MouseEvent) {
		const {x, y} = getCanvasCoordinates(event);

		// Update cursor based on position
		if (!canvas) return;

		if (isDrawing && isAddingBlock) {
			drawCurrentX = x;
			drawCurrentY = y;
			drawBBoxes();
			return;
		}

		if (isDragging && draggedBlockIndex !== null && draggedCorner && onBBoxUpdate) {
			const docling = canvasToDocling(x, y);
			const block = blocks[draggedBlockIndex];
			if (!block?.bbox) return;

			const newBBox = {...block.bbox};

			// Update the appropriate corners based on which corner is being dragged
			switch (draggedCorner) {
				case 'tl':
					newBBox.l = docling.x;
					newBBox.t = docling.y;
					break;
				case 'tr':
					newBBox.r = docling.x;
					newBBox.t = docling.y;
					break;
				case 'bl':
					newBBox.l = docling.x;
					newBBox.b = docling.y;
					break;
				case 'br':
					newBBox.r = docling.x;
					newBBox.b = docling.y;
					break;
			}

			// Ensure l < r and b < t (BOTTOMLEFT origin)
			if (newBBox.l > newBBox.r) [newBBox.l, newBBox.r] = [newBBox.r, newBBox.l];
			if (newBBox.b > newBBox.t) [newBBox.b, newBBox.t] = [newBBox.t, newBBox.b];

			onBBoxUpdate(draggedBlockIndex, newBBox);
			drawBBoxes();
			return;
		}

		// Update cursor for corner hovering
		if (selectedBlockIndex !== null) {
			const corner = getCornerAtPosition(x, y, selectedBlockIndex);
			canvas.style.cursor = corner ? 'nwse-resize' : (isAddingBlock ? 'crosshair' : 'pointer');
		} else {
			canvas.style.cursor = isAddingBlock ? 'crosshair' : 'pointer';
		}
	}

	function handleMouseUp(event: MouseEvent) {
		if (isDrawing && isAddingBlock && onBBoxDrawn) {
			const {x, y} = getCanvasCoordinates(event);

			// Get Docling coordinates for the drawn rectangle
			const start = canvasToDocling(Math.min(drawStartX, x), Math.min(drawStartY, y));
			const end = canvasToDocling(Math.max(drawStartX, x), Math.max(drawStartY, y));

			// In BOTTOMLEFT origin: l < r, b < t
			const bbox: BBox = {
				l: start.x,
				r: end.x,
				b: start.y,  // bottom is lower Y in BOTTOMLEFT
				t: end.y     // top is higher Y in BOTTOMLEFT
			};

			onBBoxDrawn(bbox);
			isDrawing = false;
		}

		if (isDragging) {
			isDragging = false;
			draggedCorner = null;
			draggedBlockIndex = null;
		}
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
		// Redraw when any aspect of the visualization changes
		if (image && canvas && ctx) {
			// Trigger on these changes
			blocks;
			selectedBlockIndex;
			showLabels;
			isDrawing;
			drawCurrentX;
			drawCurrentY;
			updateTrigger; // Force update when this changes
			drawBBoxes();
		}
	});
</script>

<div class="relative w-full h-full bg-gray-100 overflow-auto">
	<canvas
		bind:this={canvas}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		class="cursor-pointer max-w-full"
		style="cursor: {isAddingBlock ? 'crosshair' : 'pointer'}"
	></canvas>
</div>

<style>
	canvas {
		display: block;
		image-rendering: crisp-edges;
	}
</style>
