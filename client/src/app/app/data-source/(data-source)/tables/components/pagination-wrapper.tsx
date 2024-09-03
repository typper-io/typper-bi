import { Dispatch, SetStateAction, useCallback } from 'react'

import { SchemaSchema } from '@/app/app/data-source/(data-source)/tables/page'
import {
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  Pagination,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

export const PaginationWrapper = ({
  loadingSchemas,
  loading,
  schemas,
  currentSchema,
  setCurrentSchema,
  setCurrentSchemaIndex,
  currentSchemaIndex,
  setSchemas,
  handleSubmit,
}: {
  loadingSchemas: boolean
  loading: boolean
  schemas: SchemaSchema[]
  currentSchema: SchemaSchema | null
  setCurrentSchema: (schema: SchemaSchema | null) => void
  setCurrentSchemaIndex: Dispatch<SetStateAction<number>>
  currentSchemaIndex: number
  setSchemas: Dispatch<SetStateAction<SchemaSchema[]>>
  handleSubmit: () => void
}) => {
  const handleNextSchema = useCallback(() => {
    if (loadingSchemas || loading) return

    setCurrentSchemaIndex((currentSchemaIndex) => currentSchemaIndex + 1)
    setCurrentSchema(schemas[currentSchemaIndex + 1])
    setSchemas((schemas) => {
      const newSchemas = [...schemas]

      if (!currentSchema) return newSchemas

      newSchemas[currentSchemaIndex] = currentSchema

      return newSchemas
    })
  }, [
    currentSchema,
    currentSchemaIndex,
    loading,
    loadingSchemas,
    schemas,
    setCurrentSchema,
    setCurrentSchemaIndex,
    setSchemas,
  ])

  const handlePreviousSchema = useCallback(() => {
    if (loadingSchemas || loading) return

    if (currentSchemaIndex === 0) return

    setCurrentSchemaIndex((currentSchemaIndex) => currentSchemaIndex - 1)
    setCurrentSchema(schemas[currentSchemaIndex - 1])
  }, [
    currentSchemaIndex,
    loading,
    loadingSchemas,
    schemas,
    setCurrentSchema,
    setCurrentSchemaIndex,
  ])

  const handleGoToSchema = useCallback(
    (schema: SchemaSchema) => {
      if (loadingSchemas || loading) return

      if (currentSchema?.schema === schema.schema) return

      setCurrentSchemaIndex(
        schemas.findIndex((s) => s.schema === schema.schema)
      )
      setCurrentSchema(schema)
    },
    [
      currentSchema?.schema,
      loading,
      loadingSchemas,
      schemas,
      setCurrentSchema,
      setCurrentSchemaIndex,
    ]
  )

  return (
    <Pagination>
      <PaginationContent className="w-full justify-between">
        {schemas.length > 2 ? (
          <>
            <PaginationItem onClick={handlePreviousSchema}>
              <PaginationPrevious href="#" text="Previous schema" />
            </PaginationItem>
            {schemas.map((schema, index) => (
              <PaginationItem
                key={schema.schema}
                onClick={() => handleGoToSchema(schema)}
              >
                <PaginationLink
                  href="#"
                  size="default"
                  isActive={schema.schema === currentSchema?.schema}
                >
                  {index + 1}. {schema.schema}
                </PaginationLink>
              </PaginationItem>
            ))}
          </>
        ) : (
          <>
            <div /> <div />
          </>
        )}

        <PaginationItem
          onClick={
            currentSchemaIndex === schemas.length - 1
              ? handleSubmit
              : handleNextSchema
          }
        >
          <PaginationNext
            href="#"
            className={cn({
              'bg-primary hover:bg-primary/90':
                currentSchemaIndex === schemas.length - 1,
            })}
            text={
              currentSchemaIndex === schemas.length - 1
                ? 'Save schema'
                : 'Next schema'
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
