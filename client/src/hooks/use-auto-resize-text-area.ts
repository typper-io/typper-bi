import { useEffect } from 'react'

export const useAutoResizeTextArea = (
  textAreaRef: HTMLTextAreaElement | null,
  value: string,
  maxSize?: number,
  minSize = 40
) => {
  useEffect(() => {
    if (textAreaRef) {
      const scrollHeight = textAreaRef.scrollHeight

      if (textAreaRef.value === '') {
        textAreaRef.style.height = minSize + 'px'
        return
      }

      textAreaRef.style.height = '40px'
      textAreaRef.style.overflowY = 'hidden'

      if (scrollHeight < minSize) {
        textAreaRef.style.height = minSize + 'px'
        return
      }

      if (maxSize && scrollHeight > maxSize) {
        textAreaRef.style.height = maxSize + 'px'
        textAreaRef.style.overflowY = 'auto'
        return
      }

      textAreaRef.style.height = scrollHeight + 'px'
    }
  }, [maxSize, minSize, textAreaRef, value])
}
