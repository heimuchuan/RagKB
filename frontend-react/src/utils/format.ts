export function formatTime(val?: string | null): string {
  if (!val) return ''
  return String(val).replace('T', ' ').slice(0, 16)
}