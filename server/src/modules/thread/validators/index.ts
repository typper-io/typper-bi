import { z } from 'zod'

export const runNaturalLanguageQuerySchema = z.object({
  natural_language_query: z.string().min(1),
  dataSource_id: z.string().min(1),
})

export type RunNaturalLanguageQueryType = z.infer<
  typeof runNaturalLanguageQuerySchema
>

const baseDisplayOrSaveReportSchema = z.object({
  report_type: z.enum([
    'line',
    'bar',
    'pie',
    'table',
    'number',
    'doughnut',
    'polararea',
  ]),
  query: z.string().min(1),
  report_name: z.string().min(1),
  report_description: z.string().min(1),
  datasets: z
    .array(
      z.object({
        label: z.string().min(1),
        data: z.string().min(1),
        fill: z.boolean().optional(),
        type: z.enum(['line', 'bar']).optional(),
      }),
    )
    .optional(),
  labels: z.string().min(1).optional(),
  indexAxis: z.enum(['x', 'y']).optional(),
  xStacked: z.boolean().optional(),
  yStacked: z.boolean().optional(),
  dataSourceId: z.string().min(1),
})

export const displayReportSchema = baseDisplayOrSaveReportSchema.superRefine(
  (data, ctx) => {
    if (
      ['line', 'bar', 'pie', 'doughnut', 'polararea'].includes(data.report_type)
    ) {
      if (!data.datasets) {
        ctx.addIssue({
          path: ['datasets'],
          message:
            'Datasets are required for line, bar, pie, doughnut and polararea reports',
          code: 'custom',
        })
      }

      if (!data.labels) {
        ctx.addIssue({
          path: ['labels'],
          message:
            'Labels are required for line, bar, pie, doughnut and polararea reports',
          code: 'custom',
        })
      }
    }
  },
)

export type DisplayReportType = z.infer<typeof displayReportSchema>

export const searchOnWebSchema = z.object({
  query: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
})

export type SearchOnWebType = z.infer<typeof searchOnWebSchema>

export const saveInformationSchema = z.object({
  information: z.string().min(1),
  data_source_id: z.string().min(1).optional(),
})

export type SaveInformationType = z.infer<typeof saveInformationSchema>

export const registerUserFeedbackSchema = z.object({
  intent: z.enum(['positive', 'negative']),
  feedback: z.string().min(1),
  query_log_id: z.string().min(1).optional(),
  response: z.string().min(1).optional(),
  type: z.enum(['query', 'response']),
  prompt: z.string().min(1).optional(),
})

export type RegisterUserFeedbackType = z.infer<
  typeof registerUserFeedbackSchema
>
