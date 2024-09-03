import React from 'react'
import { Bar, Doughnut, Line, Pie, PolarArea } from 'react-chartjs-2'

export type PolarAreaDataset = React.ComponentProps<
  typeof PolarArea
>['data']['datasets']

export type PieDataset = React.ComponentProps<typeof Pie>['data']['datasets']

export type LineDataset = React.ComponentProps<typeof Line>['data']['datasets']

export type DoughnutDataset = React.ComponentProps<
  typeof Doughnut
>['data']['datasets']

export type BarDataset = React.ComponentProps<typeof Bar>['data']['datasets']

export type Dataset =
  | PolarAreaDataset
  | PieDataset
  | LineDataset
  | DoughnutDataset
  | BarDataset
