'use client'

import { Loader2, Mail } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

export default function SelectSchema() {
  const [loading, setLoading] = useState(false)
  const [loadingSchemas, setLoadingSchemas] = useState(true)
  const [selectedSchemas, setSelectedSchemas] = useState<Array<string>>([])
  const [schemas, setSchemas] = useState<{ name: string }[]>([])
  const [percentageLoaded, setPercentageLoaded] = useState<number>(0)

  const router = useRouter()
  const searchParams = useSearchParams()

  const dataSourceId = searchParams.get('dataSourceId')

  useEffect(() => {
    const getSchemas = async () => {
      setLoadingSchemas(true)

      const { data } = await api.get(`/data-source/${dataSourceId}/schemas`)

      if (data.length === 1) {
        await api.post(`/data-source/${dataSourceId}/schemas`, {
          selectedSchemas: [data[0].name],
        })

        router.push(`/app/data-source/tables?dataSourceId=${dataSourceId}`)

        return
      }

      setSelectedSchemas(
        data
          .filter(
            (schema: { name: string; selected: string }) => schema.selected
          )
          .map((schema: { name: string; selected: string }) => schema.name)
      )
      setSchemas(data)

      setLoadingSchemas(false)
    }

    getSchemas()
  }, [dataSourceId, router])

  const handleContinue = useCallback(async () => {
    setLoading(true)

    const response = await fetch(
      `${api.defaults.baseURL}/data-source/${dataSourceId}/schemas`,
      {
        method: 'POST',
        body: JSON.stringify({
          selectedSchemas,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )

    if (!response.body) {
      setLoading(false)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            controller.close()
            break
          }

          controller.enqueue(value)
        }
      },
    })

    const streamReader = stream.getReader()

    while (true) {
      const { done, value } = await streamReader.read()

      if (done) break

      const decoded = decoder.decode(value)

      for (const line of decoded.split('\n')) {
        const percentage = Number(line.trim())

        if (!isNaN(percentage)) {
          setPercentageLoaded((prev) => {
            if (percentage !== 0) return percentage

            return prev
          })
        }
      }
    }

    setLoading(false)

    return router.push(`/app/data-source/tables?dataSourceId=${dataSourceId}`)
  }, [dataSourceId, router, selectedSchemas, setPercentageLoaded])

  return (
    <>
      {loading ? (
        <div className="p-8 h-full gap-8 flex flex-col items-center justify-center bg-accent/50 rounded-md">
          <div className="animate-spin w-fit text-primary">
            <Loader2 size={160} />
          </div>

          <div className="flex flex-col gap-2 items-center justify-center">
            <h2 className="text-xl leading-7 font-semibold">Loading tables</h2>
            <p className="text-sm">
              {Math.round(percentageLoaded)}% tables loaded
            </p>
          </div>

          <Button className="gap-2" disabled>
            <Mail size={16} />
            You will receive a email when load
          </Button>
        </div>
      ) : (
        <div className="p-4 gap-4 flex flex-col bg-accent/50 rounded-md h-full overflow-y-auto">
          <p className="text-base leading-7">
            Select all schemas that are used by your workspace
          </p>
          {loadingSchemas ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="w-full h-8" />
              <Skeleton className="w-full h-8" />
              <Skeleton className="w-full h-8" />
              <Skeleton className="w-full h-8" />
            </div>
          ) : (
            <div className="flex flex-col h-fit w-full border-input border border-solid rounded-md">
              {schemas.map((schema, index) => (
                <div
                  key={schema.name}
                  className={cn(
                    'w-full cursor-pointer bg-screen flex items-center gap-2 p-2',
                    {
                      'border-b-input border-b border-b-solid':
                        index !== schemas.length - 1,
                    }
                  )}
                >
                  <Switch
                    defaultChecked
                    checked={selectedSchemas.includes(schema.name)}
                    onCheckedChange={
                      selectedSchemas.includes(schema.name)
                        ? () =>
                            setSelectedSchemas((schemas) =>
                              schemas.filter((id) => id !== schema.name)
                            )
                        : () =>
                            setSelectedSchemas((schemas) => [
                              ...schemas,
                              schema.name,
                            ])
                    }
                  />

                  {schema.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="w-full flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={loading || !selectedSchemas.length}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </div>
    </>
  )
}
