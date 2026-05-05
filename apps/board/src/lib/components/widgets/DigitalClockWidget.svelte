<script lang="ts">
    import IntrinsicTextWidgetBase from "./IntrinsicTextWidgetBase.svelte";

    type Props = {
        x: number;
        y: number;
        w: number;
        h: number;
        scaleHeight: number;
        z: number;
        selected: boolean;
        time: string;
        onSelect: () => void;
        onMoveStart: (event: PointerEvent) => void;
        onResizeStart: (event: PointerEvent) => void;
        onBringForward: () => void;
        onSendBackward: () => void;
        onDelete?: () => void;
        onMeasure: (size: { width: number; height: number }) => void;
    };

    let {
        x,
        y,
        w,
        h,
        scaleHeight,
        z,
        selected,
        time,
        onSelect,
        onMoveStart,
        onResizeStart,
        onBringForward,
        onSendBackward,
        onDelete,
        onMeasure,
    }: Props = $props();
</script>

<IntrinsicTextWidgetBase
    title="Digital klocka"
    {x}
    {y}
    {w}
    {h}
    {scaleHeight}
    {z}
    {selected}
    value={time}
    lineHeight="0.9"
    letterSpacing="-0.06em"
    offsetX="-0.04em"
    offsetY="0.035em"
    {onMeasure}
    {onSelect}
    {onMoveStart}
    {onResizeStart}
    {onBringForward}
    {onSendBackward}
    {onDelete}
/>
