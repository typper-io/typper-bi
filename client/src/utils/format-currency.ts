export function formatCurrency(value: number | undefined): string {
  if (value === undefined) {
    return ''
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}
