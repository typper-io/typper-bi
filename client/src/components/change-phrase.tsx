import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface ChangePhraseProps {
  phrases: string[]
}

export const ChangePhrase = ({ phrases }: ChangePhraseProps) => {
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [animation, setAnimation] = useState('fade-in')

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimation('fade-out')
      setTimeout(() => {
        setCurrentPhrase((currentPhrase) => {
          return currentPhrase === phrases.length - 1 ? 0 : currentPhrase + 1
        })
        setAnimation('fade-in')
      }, 500)
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [phrases.length])

  return (
    <span
      className={cn({
        'animate-fade-in': animation === 'fade-in',
        'animate-fade-out': animation === 'fade-out',
      })}
    >
      {phrases[currentPhrase]}.
    </span>
  )
}
