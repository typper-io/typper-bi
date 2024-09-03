import { Dataset } from '@/interfaces/dataset'

export const getLabelColor = ({
  datasets,
  index,
}: {
  datasets: Dataset
  index: number
}): string => {
  if (!datasets[0]?.hoverBackgroundColor) {
    if (typeof datasets[0]?.backgroundColor === 'string') {
      return datasets[0]?.backgroundColor
    }

    if (datasets[0]?.backgroundColor instanceof Array) {
      return datasets[0]?.backgroundColor?.[index] as string
    }
  }

  if (typeof datasets[0]?.hoverBackgroundColor === 'string') {
    return datasets[0]?.hoverBackgroundColor
  }

  if (datasets[0]?.hoverBackgroundColor instanceof Array) {
    return datasets[0]?.hoverBackgroundColor?.[index] as string
  }

  return ''
}
