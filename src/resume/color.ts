/** Pick black or white text for readability on the chosen sidebar color. */
export function sidebarInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // YIQ perceived brightness.
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#1a1a1a' : '#ffffff';
}
