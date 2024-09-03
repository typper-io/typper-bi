'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'

export const Title = () => {
  const path = usePathname()

  const step = useMemo(() => path.split('/')[3], [path])

  const router = useRouter()

  if (step === 'success') return null

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="bg-transparent w-8 h-8"
        onClick={() => router.back()}
        size="icon"
      >
        <ArrowLeft size={16} />
      </Button>

      <p className="text-3xl font-semibold leading-9">Data Source</p>
    </div>
  )
}
