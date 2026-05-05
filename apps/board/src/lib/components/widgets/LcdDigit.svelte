<script lang="ts">
	let {
		number,
		thickness = 1.25
	}: {
		number: string;
		thickness?: number;
	} = $props();

	function segmentH(length: number, t: number, px: number, py: number) {
		const right = px + length;
		return `M ${px} ${py} L ${px + 0.5 * t} ${py - t * 0.5} h ${length - t} L ${right} ${py} L ${right - 0.5 * t} ${py + 0.5 * t} h ${-length + t} Z`;
	}

	function segmentV(length: number, t: number, px: number, py: number) {
		const bottom = py + length;
		return `M ${px} ${py} L ${px + 0.5 * t} ${py + 0.5 * t} v ${length - t} L ${px} ${bottom} L ${px - 0.5 * t} ${bottom - 0.5 * t} v ${-length + t} Z`;
	}

	const LENGTH = 7;

	const digits: Record<string, string> = {
		'0': 'tl tr bl br vt vb',
		'1': 'tr br',
		'2': 'vt vb vm tr bl',
		'3': 'vt vb vm tr br',
		'4': 'vm tl tr br',
		'5': 'vt vb vm br tl',
		'6': 'tl bl br vt vm vb',
		'7': 'tr br vt',
		'8': 'tl tr bl br vt vm vb',
		'9': 'vt vm tl tr br',
	};

	const activeClass = $derived(digits[number] ?? '');

	const paths = {
		tl: segmentV(LENGTH, thickness, 5.75, 1.75),
		tr: segmentV(LENGTH, thickness, 13.25, 1.75),
		bl: segmentV(LENGTH, thickness, 5.75, 9.25),
		br: segmentV(LENGTH, thickness, 13.25, 9.25),
		vt: segmentH(LENGTH, thickness, 6, 1.5),
		vm: segmentH(LENGTH, thickness, 6, 9),
		vb: segmentH(LENGTH, thickness, 6, 16.5),
	};
</script>

<svg viewBox="4 0 11 18" class="lcd-digit {activeClass}">
	<path class="seg" id="tl" d={paths.tl} />
	<path class="seg" id="tr" d={paths.tr} />
	<path class="seg" id="bl" d={paths.bl} />
	<path class="seg" id="br" d={paths.br} />
	<path class="seg" id="vt" d={paths.vt} />
	<path class="seg" id="vm" d={paths.vm} />
	<path class="seg" id="vb" d={paths.vb} />
</svg>

<style>
	.lcd-digit {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.seg {
		stroke-linejoin: round;
		stroke-width: 0.5;
		stroke: var(--lcd-dim, rgba(0, 0, 0, 0.06));
		fill: var(--lcd-dim, rgba(0, 0, 0, 0.06));
		vector-effect: non-scaling-stroke;
	}

	.tl #tl, .tr #tr, .bl #bl, .br #br,
	.vt #vt, .vm #vm, .vb #vb {
		fill: var(--lcd-segment-active, #2a3a2e);
		stroke: var(--lcd-segment-stroke, #1e2e22);
	}
</style>
