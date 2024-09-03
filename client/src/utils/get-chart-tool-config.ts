import React from 'react'
import { Chart } from 'react-chartjs-2'

export const getChartToolConfig = ({ theme }: { theme?: string }): any => {
  const toolConfig: React.ComponentProps<typeof Chart>['options'] = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor:
          theme === 'dark' ? 'hsla(223, 84%, 5%)' : 'hsla(0, 0%, 100%)',
        titleColor:
          theme === 'dark' ? 'hsla(210, 40%, 98%)' : 'hsla(223, 84%, 5%)',
        bodyColor:
          theme === 'dark' ? 'hsla(215, 20%, 65%)' : 'hsla(215, 16%, 47%)',
        padding: 8,
        cornerRadius: 4,
        displayColors: false,
      },
    },
  }

  return toolConfig
}
