import { Dataset } from '@/interfaces/dataset'
import { formatDate, formatNumber, truncateString } from '@/utils/format-labels'

const getLabels = ({
  sortedQueryResult,
  labelsKeys,
  display,
}: {
  sortedQueryResult: Array<Record<string, any>>
  labelsKeys: string
  display: string
}) => {
  const labels = sortedQueryResult
    .map((result) => result[labelsKeys])
    .map((label) => {
      if (typeof label === 'number') {
        return formatNumber(label)
      } else if (Date.parse(label)) {
        return formatDate(label)
      } else {
        return truncateString(label, 10)
      }
    })

  if (['pie', 'doughnut', 'polararea'].includes(display)) {
    if (labels.length > 7) {
      labels.splice(6, labels.length - 6)
      labels.push('Others')
    }
  }

  return labels
}

const getGroupedData = ({
  display,
  sortedQueryResult,
  data,
  labelsKeys,
}: {
  display: string
  sortedQueryResult: Array<Record<string, any>>
  data: string
  labelsKeys: string
}) => {
  if (['pie', 'doughnut', 'polararea'].includes(display)) {
    if (sortedQueryResult.length > 7) {
      sortedQueryResult.slice(6, sortedQueryResult.length)

      const groupedDataSum = sortedQueryResult.reduce((acc, curr, index) => {
        if (index > 5) {
          if (isNaN(Number(curr[data]))) {
            return acc + 1
          }

          return acc + Number(curr[data])
        }

        return acc
      }, 0)

      sortedQueryResult = sortedQueryResult.slice(0, 6)

      sortedQueryResult.push({
        [labelsKeys]: 'Others',
        [data]: groupedDataSum,
      })
    }
  }

  return sortedQueryResult.map((result) => result[data])
}

export const formatDataset = ({
  datasets,
  labelsKeys,
  queryResult,
  display,
}: {
  datasets: Array<{
    data: string
    fill: boolean
    label: string
    type: string
  }>
  labelsKeys: string
  queryResult: Array<Record<string, any>>
  display: string
}): {
  labels: string[]
  data: Array<{
    label: string
    data: any[]
    fill: boolean
    backgroundColor: string
    borderWidth: number
    borderRadius: number
    borderColor: string
    type: any
  }>
} => {
  const sortedQueryResult = queryResult.sort(
    (a, b) => a[labelsKeys] - b[labelsKeys]
  )

  const labels = getLabels({ sortedQueryResult, labelsKeys, display })

  const allowedColors = [
    '#7BD905',
    '#FFABC7',
    '#2563EB',
    '#7C3AED',
    '#DC2626',
    '#F97316',
    '#FACC15',
  ]

  const data = datasets.map(
    (
      {
        data,
        fill,
        label,
        type,
      }: { label: string; data: string; fill: boolean; type: string },
      index: number
    ): Dataset[0] => {
      return {
        label,
        data: getGroupedData({ display, sortedQueryResult, data, labelsKeys }),
        fill,
        backgroundColor: allowedColors[index],
        borderWidth: 1,
        borderRadius: 4,
        borderColor: allowedColors[index],
        ...((['line'].includes(type) || ['line'].includes(display)) && {
          backgroundColor: allowedColors[index] + '40',
          borderRadius: 0,
          pointBackgroundColor: '#FFFFFF00',
          pointHoverBackgroundColor: allowedColors[index],
          pointBorderWidth: 0,
        }),
        ...((['pie', 'doughnut', 'polararea'].includes(type) ||
          ['pie', 'doughnut', 'polararea'].includes(display)) && {
          borderRadius: 0,
          backgroundColor: [...allowedColors]
            .map((color) => color + '40')
            .splice(0, sortedQueryResult.length),
          borderColor: [...allowedColors].splice(0, sortedQueryResult.length),
          hoverBackgroundColor: [...allowedColors]
            .map((color) => color)
            .splice(0, sortedQueryResult.length),
        }),
        ...(['bar'].includes(display) && {
          type: type as any,
        }),
      }
    }
  )

  return {
    labels,
    data: data as any[],
  }
}
