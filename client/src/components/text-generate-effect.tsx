/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect } from 'react'
import { motion, stagger, useAnimate } from 'framer-motion'
import { cn } from '@/lib/utils'

export const TextGenerateEffect = ({
  words,
  pClassName,
  spanClassName,
}: {
  words: string
  spanClassName?: string
  pClassName?: string
}) => {
  const [scope, animate] = useAnimate()
  let wordsArray = words.split(' ')
  useEffect(() => {
    animate(
      'span',
      {
        opacity: 1,
      },
      {
        duration: 2,
        delay: stagger(0.1),
      }
    )
  }, [scope.current])

  const renderWords = () => {
    return (
      <motion.p ref={scope} className={pClassName}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className={cn('opacity-0', spanClassName)}
            >
              {word}{' '}
            </motion.span>
          )
        })}
      </motion.p>
    )
  }

  return <>{renderWords()}</>
}
