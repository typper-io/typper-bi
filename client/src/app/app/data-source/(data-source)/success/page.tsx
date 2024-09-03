'use client'

import { CheckCheck } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { Skeleton } from '@/components/ui/skeleton'

export default function SelectSchema() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<{
    engine: string
    name: string
  } | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  const dataSourceId = searchParams.get('dataSourceId')

  useEffect(() => {
    const getDataSource = async () => {
      setLoading(true)

      const { data } = await api.get(`/data-source/${dataSourceId}`)

      setDataSource(data)
      setLoading(false)
    }

    getDataSource()
  }, [dataSourceId])

  const handleContinue = useCallback(() => {
    router.push(`/app/data-source`)
  }, [router])

  return (
    <div className="p-8 h-full gap-8 flex flex-col items-center justify-center bg-accent/50 rounded-md">
      <div className="bg-[#7BD9051A] w-[200px] h-[200px] rounded-full flex items-center justify-center">
        <CheckCheck size={90} color="#7BD905" />
      </div>

      <div className="flex gap-1">
        {loading ? (
          <Skeleton className="w-[50px] h-7" />
        ) : (
          <h2 className="text-xl leading-7 font-semibold truncate">
            {dataSource?.engine}
          </h2>
        )}{' '}
        {loading ? (
          <Skeleton className="w-[100px] h-7" />
        ) : (
          <h2 className="text-xl leading-7 font-semibold truncate">
            {dataSource?.name}
          </h2>
        )}{' '}
        <h2 className="text-xl leading-7 font-semibold truncate">added</h2>
      </div>

      <Button onClick={handleContinue}>Back to data sources</Button>
    </div>
  )
}
