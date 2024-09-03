'use client'

import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { PaginationWrapper } from '@/app/app/data-source/(data-source)/tables/components/pagination-wrapper'
import { TableDetails } from '@/app/app/data-source/(data-source)/tables/components/table-details'
import { convertOrganizedTablesToTableSchema } from '@/app/app/data-source/(data-source)/tables/helpers/convert-organized-tables-to-table-schema'
import {
  OrganizedTables,
  subTableOrganizer,
} from '@/app/app/data-source/(data-source)/tables/helpers/sub-table-organizer.helper'
import { ChangePhrase } from '@/components/change-phrase'
import { Skeleton } from '@/components/ui/skeleton'
import { loadingPhrases } from '@/constants/loading-phrases'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { AxiosError } from 'axios'

export interface ColumnSchema {
  column: string
  type: string
  selected: boolean
  description?: string
  enum?: Array<string>
  jsonColumns?: Array<Exclude<ColumnSchema, 'jsonColumns'>>
  columns?: Array<ColumnSchema>
}

export interface TableSchema {
  table: string
  selected: boolean
  description?: string
  columns: ColumnSchema[]
}

export interface SchemaSchema {
  schema: string
  tables: OrganizedTables[]
}

export default function Tables() {
  const [loading, setLoading] = useState(false)
  const [schemas, setSchemas] = useState<Array<SchemaSchema>>([])
  const [currentSchema, setCurrentSchema] = useState<SchemaSchema | null>(null)
  const [currentSchemaIndex, setCurrentSchemaIndex] = useState(0)
  const [loadingSchemas, setLoadingSchemas] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const errorRefs = useRef<Record<string, HTMLInputElement>>({})

  const searchParams = useSearchParams()
  const router = useRouter()

  const dataSourceId = searchParams.get('dataSourceId')

  useEffect(() => {
    const getSchemas = async () => {
      setLoadingSchemas(true)

      const { data } = await api.get<
        { schema: string; tables: TableSchema[] }[]
      >(`/data-source/${dataSourceId}/tables-schema`)

      const formattedSchemas = data.map((schema) => {
        return {
          schema: schema.schema,
          tables: schema.tables.map((table) => {
            return subTableOrganizer(table)
          }),
        }
      })

      setSchemas(formattedSchemas)
      setCurrentSchema(formattedSchemas[0])

      setLoadingSchemas(false)
    }
    getSchemas()
  }, [dataSourceId])

  const validateSchema = useCallback((schema: SchemaSchema) => {
    const errors: { [key: string]: string } = {}

    schema.tables.forEach((table) => {
      if (table.selected && !table.description) {
        errors[`${table.name}.description`] = 'The description cannot be empty.'
      }

      table.columns.forEach((column) => {
        if (column.selected && !column.description) {
          errors[`${table.name}.${column.column}.description`] =
            'The description cannot be empty.'
        }
      })

      table.subTables.forEach((subTable) => {
        if (subTable.selected && !subTable.description) {
          errors[`${table.name}.${subTable.name}.description`] =
            'The description cannot be empty.'
        }

        subTable.columns.forEach((subColumn) => {
          if (subColumn.selected && !subColumn.description) {
            errors[
              `${table.name}.${subTable.name}.${subColumn.column}.description`
            ] = 'The description cannot be empty.'
          }
        })
      })
    })

    setErrors(errors)
  }, [])

  const toggleTable = useCallback((tableIndex: number) => {
    setCurrentSchema((currentSchema) => {
      if (!currentSchema) return null

      const newTables = currentSchema.tables.map((table, index) => {
        if (index === tableIndex) {
          return {
            ...table,
            columns: table.columns.map((column) => {
              return {
                ...column,
                selected: !table.selected,
              }
            }),
            selected: !table.selected,
          }
        }

        return table
      })

      const formattedCurrentSchema = {
        ...currentSchema,
        tables: newTables,
      }

      return formattedCurrentSchema
    })
  }, [])

  const toggleSubTable = useCallback(
    (tableIndex: number, subTableIndex: number) => {
      setCurrentSchema((currentSchema) => {
        if (!currentSchema) return null

        const newTables = currentSchema.tables.map((table, index) => {
          if (index === tableIndex) {
            const newSubTables = table.subTables.map((subTable, index) => {
              if (index === subTableIndex) {
                return {
                  ...subTable,
                  selected: !subTable.selected,
                }
              }

              return subTable
            })

            return {
              ...table,
              subTables: newSubTables,
            }
          }

          return table
        })

        const formattedCurrentSchema = {
          ...currentSchema,
          tables: newTables,
        }

        return formattedCurrentSchema
      })
    },
    []
  )

  const toggleColumn = useCallback(
    ({
      tableIndex,
      columnIndex,
    }: {
      tableIndex: number
      columnIndex: number
    }) => {
      setCurrentSchema((currentSchema) => {
        if (!currentSchema) return null

        const newTables = currentSchema.tables.map((table, index) => {
          if (index === tableIndex) {
            const newColumns = table.columns.map((column, index) => {
              if (index === columnIndex) {
                return {
                  ...column,
                  selected: !column.selected,
                }
              }

              return column
            })

            return {
              ...table,
              columns: newColumns,
            }
          }

          return table
        })

        const formattedCurrentSchema = {
          ...currentSchema,
          tables: newTables,
        }

        return formattedCurrentSchema
      })
    },
    []
  )

  const toggleSubColumn = useCallback(
    ({
      tableIndex,
      subTableIndex,
      columnIndex,
    }: {
      tableIndex: number
      subTableIndex: number
      columnIndex: number
    }) => {
      setCurrentSchema((currentSchema) => {
        if (!currentSchema) return null
        const newTables = currentSchema.tables.map((table, index) => {
          if (index === tableIndex) {
            const newSubTables = table.subTables.map((subTable, index) => {
              if (index === subTableIndex) {
                const newColumns = subTable.columns.map((column, index) => {
                  if (index === columnIndex) {
                    return {
                      ...column,
                      selected: !column.selected,
                    }
                  }

                  return column
                })

                return {
                  ...subTable,
                  columns: newColumns,
                }
              }

              return subTable
            })

            return {
              ...table,
              subTables: newSubTables,
            }
          }

          return table
        })

        const formattedCurrentSchema = {
          ...currentSchema,
          tables: newTables,
        }

        return formattedCurrentSchema
      })
    },
    []
  )

  const updateTableDescription = useCallback(
    (tableIndex: number, description: string) => {
      setCurrentSchema((currentSchema) => {
        if (!currentSchema) return null

        const newTables = currentSchema.tables.map((table, index) => {
          if (index === tableIndex) {
            return {
              ...table,
              description,
            }
          }

          return table
        })

        const formattedCurrentSchema = {
          ...currentSchema,
          tables: newTables,
        }

        return formattedCurrentSchema
      })
    },
    []
  )

  const updateSubTableDescription = useCallback(
    ({
      tableIndex,
      description,
      subTableIndex,
    }: {
      tableIndex: number
      subTableIndex: number
      description: string
    }) => {
      setCurrentSchema((currentSchema) => {
        if (!currentSchema) return null

        const newTables = currentSchema.tables.map((table, index) => {
          if (index === tableIndex) {
            const newSubTables = table.subTables.map((subTable, index) => {
              if (index === subTableIndex) {
                return {
                  ...subTable,
                  description,
                }
              }

              return subTable
            })

            return {
              ...table,
              subTables: newSubTables,
            }
          }

          return table
        })

        const formattedCurrentSchema = {
          ...currentSchema,
          tables: newTables,
        }

        return formattedCurrentSchema
      })
    },
    []
  )

  const updateColumnDescription = useCallback(
    ({
      tableIndex,
      columnIndex,
      description,
    }: {
      tableIndex: number
      columnIndex: number
      description: string
    }) => {
      setCurrentSchema((currentSchema) => {
        if (!currentSchema) return null

        const newTables = currentSchema.tables.map((table, index) => {
          if (index === tableIndex) {
            const newColumns = table.columns.map((column, index) => {
              if (index === columnIndex) {
                return {
                  ...column,
                  description,
                }
              }

              return column
            })

            return {
              ...table,
              columns: newColumns,
            }
          }

          return table
        })

        const formattedCurrentSchema = {
          ...currentSchema,
          tables: newTables,
        }

        return formattedCurrentSchema
      })
    },
    []
  )

  const updateSubColumnDescription = useCallback(
    ({
      tableIndex,
      subTableIndex,
      columnIndex,
      description,
    }: {
      tableIndex: number
      subTableIndex: number
      columnIndex: number
      description: string
    }) => {
      setCurrentSchema((currentSchema) => {
        if (!currentSchema) return null

        const newTables = currentSchema.tables.map((table, index) => {
          if (index === tableIndex) {
            const newSubTables = table.subTables.map((subTable, index) => {
              if (index === subTableIndex) {
                const newColumns = subTable.columns.map((column, index) => {
                  if (index === columnIndex) {
                    return {
                      ...column,
                      description,
                    }
                  }

                  return column
                })

                return {
                  ...subTable,
                  columns: newColumns,
                }
              }

              return subTable
            })

            return {
              ...table,
              subTables: newSubTables,
            }
          }

          return table
        })

        const formattedCurrentSchema = {
          ...currentSchema,
          tables: newTables,
        }

        return formattedCurrentSchema
      })
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true)

      const newSchemas = [...schemas]

      for (const schema of newSchemas) {
        validateSchema(schema)
      }

      if (!currentSchema) {
        return newSchemas
      }

      newSchemas[currentSchemaIndex] = currentSchema

      const formattedSchemas = newSchemas.map((newSchema) => {
        return {
          schema: newSchema.schema,
          tables: newSchema.tables.map((organizedTable) =>
            convertOrganizedTablesToTableSchema(organizedTable)
          ),
        }
      })

      await api.post(`/data-source/${dataSourceId}/tables-schema`, {
        schemas: formattedSchemas,
      })

      return router.push(
        `/app/data-source/context?dataSourceId=${dataSourceId}`
      )
    } catch (error) {
      setLoading(false)

      if (error instanceof AxiosError) {
        toast('Cannot create or update data source', {
          description:
            error.response?.data.message || 'Please try again later.',
        })

        return
      }

      toast('An error occurred', {
        description: 'Please try again later.',
      })
    }
  }, [
    currentSchema,
    currentSchemaIndex,
    dataSourceId,
    router,
    schemas,
    validateSchema,
  ])

  useEffect(() => {
    window.onbeforeunload = function () {
      return 'Are you sure you want to leave?'
    }

    return () => {
      window.onbeforeunload = null
    }
  }, [])

  return (
    <>
      {loading ? (
        <div className="p-8 h-full gap-8 flex flex-col items-center justify-center bg-accent/50 rounded-md">
          <div className="animate-spin w-fit text-primary">
            <Loader2 size={160} />
          </div>
          <div className="flex flex-col gap-2 items-center justify-center">
            <h2 className="text-xl leading-7 font-semibold">
              Saving your schemas
            </h2>
            <p className="text-sm">
              <ChangePhrase phrases={loadingPhrases} />
            </p>
          </div>
        </div>
      ) : loadingSchemas && currentSchema === null ? (
        <>
          <Skeleton className="w-full h-full" />
          <Skeleton className="w-full h-full" />
        </>
      ) : (
        currentSchema !== null && (
          <div className="p-4 gap-8 h-full flex flex-col bg-accent/50 rounded-lg overflow-y-auto">
            <div className="flex flex-col gap-1">
              <p className="leading-7 text-xl">
                Schema {currentSchemaIndex + 1}:{' '}
                <span className="font-semibold">{currentSchema.schema}</span>
              </p>
              <p className="text-muted-foreground text-sm leading-5">
                Add at least one table or the schema will automatically be
                ignored.
              </p>
            </div>

            {currentSchema.tables.map((table, tableIndex) => {
              return (
                <TableDetails
                  errorRefs={errorRefs}
                  errors={errors}
                  table={table}
                  tableIndex={tableIndex}
                  toggleTable={toggleTable}
                  toggleSubTable={toggleSubTable}
                  toggleColumn={toggleColumn}
                  toggleSubColumn={toggleSubColumn}
                  key={tableIndex}
                  updateTableDescription={updateTableDescription}
                  updateSubTableDescription={updateSubTableDescription}
                  updateColumnDescription={updateColumnDescription}
                  updateSubColumnDescription={updateSubColumnDescription}
                />
              )
            })}
          </div>
        )
      )}

      {loadingSchemas ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        currentSchema && (
          <PaginationWrapper
            currentSchema={currentSchema}
            handleSubmit={handleSubmit}
            currentSchemaIndex={currentSchemaIndex}
            loading={loading}
            loadingSchemas={loadingSchemas}
            schemas={schemas}
            setCurrentSchema={setCurrentSchema}
            setCurrentSchemaIndex={setCurrentSchemaIndex}
            setSchemas={setSchemas}
          />
        )
      )}
    </>
  )
}
