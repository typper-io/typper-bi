export const formatNumber = (value: number) => {
  if (value >= 100000) return `${(value / 1000).toFixed(1)}k`

  if (value % 1 !== 0) {
    return Number(value).toFixed(2)
  }

  return value.toString()
}

export const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    month: 'short',
    day: 'numeric',
  })
}

export const truncateString = (str: string, num: number) => {
  if (!str) return str

  if (str.length > num) {
    return str.slice(0, num) + '...'
  } else {
    return str
  }
}
