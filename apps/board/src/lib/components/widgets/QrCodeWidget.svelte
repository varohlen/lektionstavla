<script lang="ts">
	import { onMount } from 'svelte';
	import WidgetShell from './WidgetShell.svelte';

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		selected: boolean;
		value: string;
		onSelect: () => void;
		onMoveStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onBringForward: () => void;
		onSendBackward: () => void;
		onDelete?: () => void;
		onValueChange: (value: string) => void;
	};

	let {
		x,
		y,
		w,
		h,
		z,
		selected,
		value,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete,
		onValueChange
	}: Props = $props();

	let inputValue = $state(value);
	let svgContent = $state('');
	let inputElement = $state<HTMLInputElement | null>(null);

	// QR code generation using a minimal encoder
	// We generate a simple QR code as SVG paths

	const EC_L = 1;

	function generateQR(text: string): string[][] {
		if (!text.trim()) return [];
		// Use a canvas-free QR approach: encode as a module grid
		// For simplicity and zero-dependency, we use a basic QR encoding
		const modules = encodeQR(text);
		return modules;
	}

	// Minimal QR Code encoder (Mode: Byte, EC Level: L)
	// Supports up to version 10 (~271 chars) which is plenty for URLs
	function encodeQR(data: string): string[][] {
		const bytes = new TextEncoder().encode(data);
		const version = getMinVersion(bytes.length);
		if (version < 1) return [];

		const size = version * 4 + 17;
		const grid: string[][] = Array.from({ length: size }, () =>
			Array.from({ length: size }, () => '')
		);
		const reserved: boolean[][] = Array.from({ length: size }, () =>
			Array.from({ length: size }, () => false)
		);

		placeFinder(grid, reserved, 0, 0);
		placeFinder(grid, reserved, size - 7, 0);
		placeFinder(grid, reserved, 0, size - 7);

		// Timing patterns
		for (let i = 8; i < size - 8; i++) {
			if (!reserved[6][i]) {
				grid[6][i] = i % 2 === 0 ? 'D' : '';
				reserved[6][i] = true;
			}
			if (!reserved[i][6]) {
				grid[i][6] = i % 2 === 0 ? 'D' : '';
				reserved[i][6] = true;
			}
		}

		// Alignment patterns
		const alignPos = getAlignmentPositions(version);
		for (const r of alignPos) {
			for (const c of alignPos) {
				if (reserved[r]?.[c]) continue;
				placeAlignment(grid, reserved, r, c);
			}
		}

		// Dark module
		grid[size - 8][8] = 'D';
		reserved[size - 8][8] = true;

		// Reserve format info areas
		for (let i = 0; i < 8; i++) {
			reserved[8][i] = true;
			reserved[8][size - 1 - i] = true;
			reserved[i][8] = true;
			reserved[size - 1 - i][8] = true;
		}
		reserved[8][8] = true;

		// Reserve version info for v >= 7
		if (version >= 7) {
			for (let i = 0; i < 6; i++) {
				for (let j = 0; j < 3; j++) {
					reserved[i][size - 11 + j] = true;
					reserved[size - 11 + j][i] = true;
				}
			}
		}

		// Encode data
		const dataBits = encodeData(bytes, version);
		placeData(grid, reserved, dataBits, size);

		// Apply mask 0 (checkerboard) - simple and effective
		applyMask(grid, reserved, size);

		// Place format info
		placeFormatInfo(grid, size);

		// Place version info
		if (version >= 7) {
			placeVersionInfo(grid, version, size);
		}

		return grid;
	}

	function getMinVersion(byteLen: number): number {
		// Byte mode capacities for EC level L
		const caps = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271];
		for (let v = 1; v <= 10; v++) {
			if (byteLen <= caps[v]) return v;
		}
		return -1;
	}

	function placeFinder(grid: string[][], reserved: boolean[][], row: number, col: number) {
		for (let r = -1; r <= 7; r++) {
			for (let c = -1; c <= 7; c++) {
				const gr = row + r;
				const gc = col + c;
				if (gr < 0 || gc < 0 || gr >= grid.length || gc >= grid.length) continue;
				const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
				const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
				const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
				grid[gr][gc] = (isOuter || isInner) && !isBorder ? 'D' : isBorder ? '' : '';
				if (!isBorder) {
					grid[gr][gc] = isOuter || isInner ? 'D' : '';
				}
				reserved[gr][gc] = true;
			}
		}
	}

	function placeAlignment(grid: string[][], reserved: boolean[][], row: number, col: number) {
		for (let r = -2; r <= 2; r++) {
			for (let c = -2; c <= 2; c++) {
				const gr = row + r;
				const gc = col + c;
				if (gr < 0 || gc < 0 || gr >= grid.length || gc >= grid.length) continue;
				const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
				const isCenter = r === 0 && c === 0;
				grid[gr][gc] = isEdge || isCenter ? 'D' : '';
				reserved[gr][gc] = true;
			}
		}
	}

	function getAlignmentPositions(version: number): number[] {
		if (version === 1) return [];
		const positions: number[][] = [
			[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
			[6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
		];
		return positions[version] || [];
	}

	function encodeData(bytes: Uint8Array, version: number): number[] {
		const bits: number[] = [];
		// Mode indicator: Byte = 0100
		bits.push(0, 1, 0, 0);

		// Character count (8 bits for v1-9, 16 bits for v10+)
		const countBits = version <= 9 ? 8 : 16;
		for (let i = countBits - 1; i >= 0; i--) {
			bits.push((bytes.length >> i) & 1);
		}

		// Data
		for (const byte of bytes) {
			for (let i = 7; i >= 0; i--) {
				bits.push((byte >> i) & 1);
			}
		}

		// Terminator
		const totalDataBits = getDataCapacity(version) * 8;
		const terminatorLen = Math.min(4, totalDataBits - bits.length);
		for (let i = 0; i < terminatorLen; i++) bits.push(0);

		// Pad to byte boundary
		while (bits.length % 8 !== 0) bits.push(0);

		// Pad bytes
		const padBytes = [0xEC, 0x11];
		let padIndex = 0;
		while (bits.length < totalDataBits) {
			const pb = padBytes[padIndex % 2];
			for (let i = 7; i >= 0; i--) bits.push((pb >> i) & 1);
			padIndex++;
		}

		// Add error correction
		const dataBytes: number[] = [];
		for (let i = 0; i < bits.length; i += 8) {
			let byte = 0;
			for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] || 0);
			dataBytes.push(byte);
		}

		const ecBytes = generateEC(dataBytes, version);
		const allBytes = [...dataBytes, ...ecBytes];

		const result: number[] = [];
		for (const byte of allBytes) {
			for (let i = 7; i >= 0; i--) result.push((byte >> i) & 1);
		}
		return result;
	}

	function getDataCapacity(version: number): number {
		// Data codewords for EC level L
		const caps = [0, 19, 34, 55, 80, 108, 136, 156, 194, 232, 271];
		return caps[version] || 0;
	}

	function getECCount(version: number): number {
		const counts = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18];
		return counts[version] || 0;
	}

	// GF(256) arithmetic for Reed-Solomon
	const GF_EXP = new Uint8Array(512);
	const GF_LOG = new Uint8Array(256);
	{
		let x = 1;
		for (let i = 0; i < 255; i++) {
			GF_EXP[i] = x;
			GF_LOG[x] = i;
			x = (x << 1) ^ (x >= 128 ? 0x11D : 0);
		}
		for (let i = 255; i < 512; i++) {
			GF_EXP[i] = GF_EXP[i - 255];
		}
	}

	function gfMul(a: number, b: number): number {
		if (a === 0 || b === 0) return 0;
		return GF_EXP[GF_LOG[a] + GF_LOG[b]];
	}

	function generateEC(data: number[], version: number): number[] {
		const ecCount = getECCount(version);
		// Generate generator polynomial
		let gen = [1];
		for (let i = 0; i < ecCount; i++) {
			const newGen = Array.from({ length: gen.length + 1 }, () => 0);
			for (let j = 0; j < gen.length; j++) {
				newGen[j] ^= gen[j];
				newGen[j + 1] ^= gfMul(gen[j], GF_EXP[i]);
			}
			gen = newGen;
		}

		const msg = [...data, ...Array.from({ length: ecCount }, () => 0)];
		for (let i = 0; i < data.length; i++) {
			const coef = msg[i];
			if (coef !== 0) {
				for (let j = 0; j < gen.length; j++) {
					msg[i + j] ^= gfMul(gen[j], coef);
				}
			}
		}

		return msg.slice(data.length);
	}

	function placeData(grid: string[][], reserved: boolean[][], bits: number[], size: number) {
		let bitIndex = 0;
		let upward = true;

		for (let col = size - 1; col >= 0; col -= 2) {
			if (col === 6) col = 5; // Skip timing column

			const rows = upward
				? Array.from({ length: size }, (_, i) => size - 1 - i)
				: Array.from({ length: size }, (_, i) => i);

			for (const row of rows) {
				for (let c = 0; c < 2; c++) {
					const actualCol = col - c;
					if (actualCol < 0 || reserved[row][actualCol]) continue;
					grid[row][actualCol] = bitIndex < bits.length && bits[bitIndex] ? 'D' : '';
					bitIndex++;
				}
			}

			upward = !upward;
		}
	}

	function applyMask(grid: string[][], reserved: boolean[][], size: number) {
		// Mask 0: (row + col) % 2 === 0
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				if (reserved[r][c]) continue;
				if ((r + c) % 2 === 0) {
					grid[r][c] = grid[r][c] === 'D' ? '' : 'D';
				}
			}
		}
	}

	function placeFormatInfo(grid: string[][], size: number) {
		// Format info for EC level L, mask 0 = 0b111011111000100
		const formatBits = 0b111011111000100;
		const positions1: [number, number][] = [
			[0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
			[7, 8], [8, 8], [8, 7], [8, 5], [8, 4], [8, 3],
			[8, 2], [8, 1], [8, 0]
		];
		const positions2: [number, number][] = [
			[8, size - 1], [8, size - 2], [8, size - 3], [8, size - 4],
			[8, size - 5], [8, size - 6], [8, size - 7], [8, size - 8],
			[size - 7, 8], [size - 6, 8], [size - 5, 8], [size - 4, 8],
			[size - 3, 8], [size - 2, 8], [size - 1, 8]
		];

		for (let i = 0; i < 15; i++) {
			const bit = (formatBits >> (14 - i)) & 1;
			const [r1, c1] = positions1[i];
			const [r2, c2] = positions2[i];
			grid[r1][c1] = bit ? 'D' : '';
			grid[r2][c2] = bit ? 'D' : '';
		}
	}

	function placeVersionInfo(grid: string[][], version: number, size: number) {
		const versionInfoBits: Record<number, number> = {
			7: 0x07C94, 8: 0x085BC, 9: 0x09A99, 10: 0x0A4D3,
		};
		const info = versionInfoBits[version];
		if (!info) return;

		for (let i = 0; i < 18; i++) {
			const bit = (info >> i) & 1;
			const r = Math.floor(i / 3);
			const c = size - 11 + (i % 3);
			grid[r][c] = bit ? 'D' : '';
			grid[c][r] = bit ? 'D' : '';
		}
	}

	function renderSVG(modules: string[][]): string {
		if (modules.length === 0) return '';
		const size = modules.length;
		const quiet = 2;
		const total = size + quiet * 2;
		let paths = '';

		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				if (modules[r][c] === 'D') {
					paths += `M${c + quiet},${r + quiet}h1v1h-1z`;
				}
			}
		}

		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">
			<rect width="${total}" height="${total}" fill="white"/>
			<path d="${paths}" fill="currentColor"/>
		</svg>`;
	}

	function handleInput(event: Event) {
		inputValue = (event.target as HTMLInputElement).value;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			applyUrl();
		}
	}

	function applyUrl() {
		onValueChange(inputValue);
	}

	$effect(() => {
		const modules = generateQR(value);
		svgContent = renderSVG(modules);
	});

	$effect(() => {
		if (!selected) {
			inputValue = value;
		}
	});
</script>

<WidgetShell
	title="QR-kod"
	{x}
	{y}
	{w}
	{h}
	{z}
	{selected}
	{onSelect}
	{onMoveStart}
	{onResizeStart}
	{onBringForward}
	{onSendBackward}
	{onDelete}
>
	<div class="qr-container">
		<div class="qr-display">
			{#if svgContent}
				{@html svgContent}
			{:else}
				<div class="qr-placeholder">
					<span>Ange URL</span>
				</div>
			{/if}
		</div>

		{#if selected}
			<div class="qr-input-row">
				<input
					bind:this={inputElement}
					class="qr-input"
					type="url"
					placeholder="https://..."
					value={inputValue}
					oninput={handleInput}
					onkeydown={handleKeyDown}
				/>
				<button class="qr-apply" type="button" onclick={applyUrl}>OK</button>
			</div>
		{/if}
	</div>
</WidgetShell>

<style>
	.qr-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.3rem;
		box-sizing: border-box;
	}

	.qr-display {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 0;
		color: #000;
	}

	.qr-display :global(svg) {
		width: 100%;
		height: 100%;
		object-fit: contain;
		max-width: 100%;
		max-height: 100%;
	}

	.qr-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: color-mix(in srgb, var(--text) 32%, transparent);
		font-size: 0.9rem;
	}

	.qr-input-row {
		display: flex;
		gap: 0.3rem;
		width: 100%;
		flex-shrink: 0;
	}

	.qr-input {
		flex: 1;
		height: 1.8rem;
		padding: 0 0.45rem;
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 0.3rem;
		background: transparent;
		color: var(--text);
		font: inherit;
		font-size: 0.78rem;
		outline: none;
	}

	.qr-input:focus {
		border-color: var(--brand-primary-500);
	}

	.qr-apply {
		height: 1.8rem;
		padding: 0 0.65rem;
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 0.3rem;
		background: color-mix(in srgb, var(--brand-primary-500) 12%, transparent);
		color: var(--text);
		font: inherit;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
	}

	.qr-apply:hover {
		background: color-mix(in srgb, var(--brand-primary-500) 22%, transparent);
	}
</style>
