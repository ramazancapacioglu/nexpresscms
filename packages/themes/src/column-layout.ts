export function getColumnWidthsFromLayout(layout: string, count: number): string[] {
  const map: Record<string, string[]> = {
    "12": ["100%"],
    "6+6": ["50%", "50%"],
    "4+8": ["33.333%", "66.667%"],
    "8+4": ["66.667%", "33.333%"],
    "4+4+4": ["33.333%", "33.333%", "33.333%"],
    "3+6+3": ["25%", "50%", "25%"],
    "3+3+3+3": ["25%", "25%", "25%", "25%"],
  };
  if (map[layout] && map[layout]!.length === count) {
    return map[layout]!;
  }
  const pct = `${(100 / Math.max(1, count)).toFixed(2)}%`;
  return Array.from({ length: count }, () => pct);
}
