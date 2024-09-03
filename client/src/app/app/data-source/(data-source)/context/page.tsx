'use client'

import { Equal, Info, Loader2, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { ChangePhrase } from '@/components/change-phrase'
import { Button } from '@/components/ui/button'
import { loadingPhrases } from '@/constants/loading-phrases'
import { Reorder } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/services/api'
import { Skeleton } from '@/components/ui/skeleton'

export default function SelectSchema() {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Array<string>>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [rule, setRule] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()

  const dataSourceId = searchParams.get('dataSourceId')

  useEffect(() => {
    const getContext = async () => {
      setLoadingItems(true)

      const { data } = await api.get(`/data-source/${dataSourceId}/context`)

      setItems(data)

      setLoadingItems(false)
    }

    getContext()
  }, [dataSourceId])

  const addRule = useCallback(() => {
    if (!rule) return

    setRule('')
    setItems([...items, rule])
  }, [items, rule])

  const removeRule = useCallback(
    (index: number) => {
      setItems(items.filter((_, i) => i !== index))
    },
    [items]
  )

  const handleContinue = useCallback(async () => {
    if (loading) return

    setLoading(true)

    await api.post(`/data-source/${dataSourceId}/context`, {
      context: items,
    })

    router.push(`/app/data-source/success?dataSourceId=${dataSourceId}`)

    setLoading(false)
  }, [dataSourceId, items, loading, router])

  const handleSkip = useCallback(() => {
    router.push(`/app/data-source/success?dataSourceId=${dataSourceId}`)
  }, [dataSourceId, router])

  return (
    <>
      {loading ? (
        <div className="p-8 h-full gap-8 flex flex-col items-center justify-center bg-accent/50 rounded-md">
          <div className="animate-spin w-fit text-primary">
            <Loader2 size={160} />
          </div>
          <div className="flex flex-col gap-2 items-center justify-center">
            <h2 className="text-xl leading-7 font-semibold">
              Adding your data source
            </h2>
            <p className="text-sm">
              <ChangePhrase phrases={loadingPhrases} />
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 gap-9 flex flex-col bg-accent/50 rounded-md h-full overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div className="border flex gap-4 rounded-lg items-center p-4">
              <Info size={16} />
              <p>
                You can add context about the data source or additional
                information such as business rules. The most important
                information should be at the front.
              </p>
            </div>

            <Textarea
              placeholder="Context or additional information"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addRule()
                }
              }}
              onChange={(e) => setRule(e.target.value)}
              value={rule}
            />

            <Button
              variant="secondary"
              className="w-fit"
              onClick={addRule}
              disabled={loadingItems}
            >
              Add
            </Button>
          </div>

          {loadingItems ? (
            <div className="flex flex-col w-full gap-2">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          ) : (
            <Reorder.Group axis="y" values={items} onReorder={setItems}>
              {items.map((item, index) => (
                <div key={item} className="flex w-full items-center">
                  <p className="text-muted-foreground w-10 flex justify-center">
                    {index + 1}º
                  </p>
                  <Reorder.Item
                    value={item}
                    className="flex justify-between items-center border-b border-b-solid border-b-border h-10 w-full"
                  >
                    <div className="flex items-center gap-4">
                      <Equal size={16} />
                      <p>{item}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRule(index)}
                    >
                      <X size={16} />
                    </Button>
                  </Reorder.Item>
                </div>
              ))}
            </Reorder.Group>
          )}
        </div>
      )}
      <div className="w-full flex justify-end gap-4">
        <Button onClick={handleSkip} disabled={loading} variant="secondary">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Skip and add data source
        </Button>

        <Button onClick={handleContinue} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add data source
        </Button>
      </div>
    </>
  )
}
