type IntrinsicTextMetrics = {
  fontSize: number;
  paddingInline: number;
  paddingBlock: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getIntrinsicTextMetrics(height: number): IntrinsicTextMetrics {
  const paddingBlock = clamp(height * 0.08, 2, 18);
  const paddingInline = clamp(height * 0.18, 10, 40);
  const contentHeight = Math.max(1, height - paddingBlock * 2);
  const fontSize = Math.max(12, contentHeight * 0.92);

  return {
    fontSize,
    paddingInline,
    paddingBlock,
  };
}
