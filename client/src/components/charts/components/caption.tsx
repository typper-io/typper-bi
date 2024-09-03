import { Dataset } from '@/interfaces/dataset'
import { getLabelColor } from '@/utils/get-label-color'

export const Caption = ({
  datasets,
  hideCaption,
  labels,
}: {
  hideCaption?: boolean
  labels: Array<string>
  datasets: Dataset
}) => {
  return (
    <div className="flex gap-2 py-2 px-4 overflow-hidden">
      {!hideCaption &&
        labels.map((label, index) => (
          <div key={label as string} className="flex items-center">
            <div
              id="pie-chart-legend"
              className="w-2 h-2 rounded-[2px] mr-2"
              style={{
                backgroundColor: getLabelColor({ datasets, index }),
              }}
            />
            <p className="truncate">{label as string}</p>
          </div>
        ))}
    </div>
  )
}
