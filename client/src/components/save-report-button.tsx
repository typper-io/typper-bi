import { Checks } from '@phosphor-icons/react'
import { Heart, Loader2, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export interface SaveReportProps {
  name?: string
  description?: string
  dataSourceId: string
  threadId?: string
  display: string
  query: string
  arguments?: Record<string, string>
  disabled?: boolean
  customizations?: Record<string, any>
}

export const SaveReport = ({
  dataSourceId,
  description,
  display,
  name,
  query,
  threadId,
  arguments: filterArguments,
  disabled,
  customizations,
}: SaveReportProps) => {
  const [saved, setSaved] = useState(false)
  const [savedQuery, setSavedQuery] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [reportName, setReportName] = useState(name)
  const [reportDescription, setReportDescription] = useState(description)
  const [loadingNameSuggestion, setLoadingNameSuggestion] = useState(false)
  const [loadingDescriptionSuggestion, setLoadingDescriptionSuggestion] =
    useState(false)

  const handleSave = useCallback(async () => {
    try {
      if (saved || loading) return

      setLoading(true)

      await api.post('/report', {
        dataSourceId,
        description: reportDescription,
        display,
        name: reportName,
        query,
        threadId,
        arguments: filterArguments,
        customizations,
      })

      setLoading(false)
      setSaved(true)
      setSavedQuery(query)
      setDetailsDialogOpen(false)
    } catch (error) {
      setLoading(false)
      setSaved(false)
      setSavedQuery(null)
    }
  }, [
    saved,
    loading,
    dataSourceId,
    reportDescription,
    display,
    reportName,
    query,
    threadId,
    filterArguments,
    customizations,
  ])

  const handleSuggest = useCallback(
    async ({ field }: { field: 'name' | 'description' }) => {
      try {
        if (field === 'name') {
          setLoadingNameSuggestion(true)
        }

        if (field === 'description') {
          setLoadingDescriptionSuggestion(true)
        }

        const { data } = await api.post('/suggest/report/details', {
          query,
        })

        if (!data) return

        if (field === 'name') {
          setReportName(data.reportName)
        }

        if (field === 'description') {
          setReportDescription(data.reportDescription)
        }

        if (field === 'name') {
          setLoadingNameSuggestion(false)
        }

        if (field === 'description') {
          setLoadingDescriptionSuggestion(false)
        }
      } catch (error) {
        if (field === 'name') {
          setLoadingNameSuggestion(false)
        }

        if (field === 'description') {
          setLoadingDescriptionSuggestion(false)
        }
      }
    },
    [query]
  )

  useEffect(() => {
    if (savedQuery !== query) {
      return setSaved(false)
    }

    if (savedQuery === query) {
      return setSaved(true)
    }

    return () => {
      setSavedQuery(null)
    }
  }, [query, savedQuery])

  return (
    <>
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save report</DialogTitle>
          </DialogHeader>
          <div className="flex w-full gap-4 items-center">
            <Label htmlFor="name" className="w-24 text-right">
              Name
            </Label>
            <div className="relative w-full">
              <Input
                id="name"
                value={reportName}
                onChange={(event) => setReportName(event.target.value)}
              />

              <Button
                variant="ghost"
                className="absolute right-0 top-0"
                onClick={() => handleSuggest({ field: 'name' })}
                disabled={loadingNameSuggestion}
              >
                {loadingNameSuggestion ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
              </Button>
            </div>
          </div>
          <div className="flex w-full gap-4 items-center">
            <Label htmlFor="description" className="w-24 text-right">
              Description
            </Label>
            <div className="relative w-full">
              <Input
                id="description"
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
              />
              <Button
                variant="ghost"
                className="absolute right-0 top-0"
                onClick={() => handleSuggest({ field: 'description' })}
                disabled={loadingDescriptionSuggestion}
              >
                {loadingDescriptionSuggestion ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Save report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        variant={saved ? 'secondary' : 'default'}
        className="flex gap-2"
        onClick={
          !name && !description ? () => setDetailsDialogOpen(true) : handleSave
        }
        disabled={saved || loading || disabled}
      >
        {saved ? (
          <Checks size={16} className="animate-fade-in" />
        ) : loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Heart size={16} className="animate-fade-in" />
        )}
        {saved ? 'Saved report' : 'Save report'}
      </Button>
    </>
  )
}
