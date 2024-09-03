import Editor, { OnMount, useMonaco } from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import _ from 'lodash'
import { useTheme } from 'next-themes'
import * as IMonaco from 'monaco-editor'

import { api } from '@/services/api'

interface CodeEditorProps {
  dataSourceId: string
  queryValue: string
  setQueryValue: (value: string) => void
  language: 'json' | 'sql'
  engine: string
  runQuery: () => Promise<void>
  formatQuery: () => void
}

export const CodeEditor = ({
  dataSourceId,
  queryValue,
  setQueryValue,
  language,
  engine,
  runQuery,
  formatQuery,
}: CodeEditorProps) => {
  const [completions, setCompletions] = useState('')

  const { theme } = useTheme()

  const monaco = useMonaco()

  const editorRef = useRef<IMonaco.editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
  }, [])

  const getSuggestionsFromAI = useCallback(
    async (code: string, engine: string) => {
      try {
        if (!code || !engine) return ''

        const { data: suggestedCode } = await api.post('/suggest/code', {
          code,
          language: engine,
        })

        if (!suggestedCode) return ''

        return suggestedCode
      } catch (error) {
        return ''
      }
    },
    []
  )

  useEffect(() => {
    const fetchTables = async () => {
      if (!dataSourceId) return

      const { data } = await api.get(`/data-source/${dataSourceId}/tables`)

      if (!data) return

      const tables = data.map((table: any) => table.name)

      monaco?.languages.registerCompletionItemProvider(language, {
        triggerCharacters: ['.', ' '],
        provideCompletionItems: () => {
          return {
            suggestions: tables.map((table: string) => ({
              label: table,
              kind: monaco.languages.CompletionItemKind.Text,
              insertText: table,
            })),
          }
        },
      })
    }

    fetchTables()
  }, [dataSourceId, monaco?.languages, language])

  const debounceFetchRef = useRef(
    _.debounce(async (value: string, engine: string) => {
      const completionsResponse = await getSuggestionsFromAI(value, engine)

      if (!completionsResponse) return

      setCompletions(completionsResponse)
    }, 1000)
  )

  const onChange = useCallback(
    async (value: string) => {
      setQueryValue(value)

      debounceFetchRef.current(value, engine)
    },
    [setQueryValue, engine]
  )

  useEffect(() => {
    if (monaco) {
      monaco.languages.registerInlineCompletionsProvider(language, {
        provideInlineCompletions: () => {
          return {
            items: [
              {
                insertText: completions,
              },
            ],
          }
        },
        freeInlineCompletions: (completions) => {
          return completions
        },
      })
    }
  }, [completions, monaco, language])

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('typper-theme', {
        base: theme === 'light' ? 'vs' : 'vs-dark',
        colors: {
          'editor.background': theme === 'light' ? '#FFFFFF' : '#01050D',
          'editor.foreground': theme === 'light' ? '#020817' : '#FBFFF6',
          'editor.lineHighlightBackground':
            theme === 'light' ? '#FFFFFF' : '#020817CC',
          'editorCursor.foreground': theme === 'light' ? '#020817' : '#FCA5A5',
          'editorSuggestWidget.background':
            theme === 'light' ? '#FFFFFF' : '#020817CC',
          'editorSuggestWidget.border':
            theme === 'light' ? '#FFFFFF' : '#020817CC',
          'editorSuggestWidget.foreground':
            theme === 'light' ? '#020817' : '#D1D5DB',
        },
        inherit: true,
        rules: [],
      })

      editorRef.current?.addAction({
        id: 'run',
        label: 'Run Query',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: runQuery,
      })

      editorRef.current?.addAction({
        id: 'format',
        label: 'Format Query',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: formatQuery,
      })

      monaco.editor.addEditorAction({
        id: 'run',
        label: 'Run',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: runQuery,
      })

      monaco.editor.addKeybindingRule({
        keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        command: 'run',
      })

      monaco.editor.addCommand({
        id: 'open-command-palette',
        run: () => {
          editorRef.current?.getAction('editor.action.quickCommand')?.run()
        },
      })

      monaco.editor.addKeybindingRule({
        keybinding:
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
        command: 'open-command-palette',
      })

      monaco.editor.setTheme('typper-theme')
    }
  }, [monaco, theme, runQuery, formatQuery])

  useEffect(() => {
    if (monaco && editorRef.current) {
      const model = editorRef.current.getModel()

      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }, [monaco, language])

  return (
    <Editor
      onMount={handleEditorDidMount}
      height="100%"
      defaultLanguage={language}
      loading={'Loading your AI Editor...'}
      theme="typper-theme"
      value={queryValue}
      onChange={(value, e) => {
        onChange(value || '')
        if (e.changes[0].text === completions) {
          setCompletions('')
        }
      }}
    />
  )
}
