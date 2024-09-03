import { Code, Copy, Download } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useCallback } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneLight,
  oneDark,
} from 'react-syntax-highlighter/dist/esm/styles/prism'

import { Button } from '@/components/ui/button'

interface ChatCodeViewProps extends React.HTMLAttributes<HTMLDivElement> {
  language: string
  isChatView?: boolean
}

interface QueryCodeViewProps extends React.HTMLAttributes<HTMLDivElement> {
  language: string
  correctQuery?: () => Promise<void>
  isQueryView?: boolean
}

export type CodeViewProps = ChatCodeViewProps & QueryCodeViewProps

export const CodeView = ({
  language,
  children,
  correctQuery,
  isQueryView = false,
}: CodeViewProps) => {
  const { theme } = useTheme()

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(String(children))
  }, [children])

  const downloadCode = useCallback(() => {
    const element = document.createElement('a')
    const file = new Blob([String(children)], {
      type: 'text/plain',
    })

    element.href = URL.createObjectURL(file)
    element.download = `code.${language}`
    document.body.appendChild(element)
    element.click()
  }, [children, language])

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-0 bg-accent/50 rounded-lg">
        <div className="bg-accent/50 px-4 py-2 rounded-lg flex justify-between">
          <p className="uppercase font-semibold text-lg leading-7 not-prose items-center flex">
            {language}
          </p>

          <div className="flex gap-2">
            {isQueryView ? (
              <Button variant="secondary" onClick={correctQuery}>
                Apply fix
              </Button>
            ) : (
              <Button variant="secondary" onClick={downloadCode}>
                <Download size={16} />
              </Button>
            )}
            <Button variant="secondary" onClick={handleCopy}>
              <Copy size={16} />
            </Button>
          </div>
        </div>

        <SyntaxHighlighter
          PreTag="section"
          wrapLongLines={true}
          language={language}
          style={theme !== 'dark' ? oneLight : oneDark}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>

      {isQueryView ? (
        <Button onClick={correctQuery} className="w-fit">
          Apply fix
        </Button>
      ) : (
        <Link href={`/app/query&query=${encodeURI(String(children))}`}>
          <Button variant="secondary" className="gap-2">
            <Code size={16} />
            Open Query Runner
          </Button>
        </Link>
      )}
    </div>
  )
}
