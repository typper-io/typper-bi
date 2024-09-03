import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Mic, Trash } from 'lucide-react'
import { Stop } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

export const AudioRecorder = ({
  setAudioChunks,
  recording,
  setRecording,
  audioChunks,
  setAudioUrl,
  audioRef,
  setAudioPlaying,
}: {
  setAudioChunks: Dispatch<SetStateAction<(BlobPart | Uint8Array)[]>>
  recording: boolean
  setRecording: Dispatch<SetStateAction<boolean>>
  audioChunks: (BlobPart | Uint8Array)[]
  setAudioUrl: Dispatch<SetStateAction<string>>
  audioRef: React.MutableRefObject<HTMLAudioElement | null>
  setAudioPlaying: Dispatch<SetStateAction<boolean>>
}) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  const startRecording = useCallback(async () => {
    setAudioChunks([])
    setAudioUrl('')
    setAudioPlaying(false)
    audioRef.current?.remove()
    audioRef.current = null

    if (audioChunks.length) {
      return
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)

    setMediaRecorder(recorder)

    recorder.ondataavailable = (event) => {
      setAudioChunks((currentChunks) => [...currentChunks, event.data])
    }
    recorder.start()
    setRecording(true)
  }, [
    audioChunks.length,
    audioRef,
    setAudioChunks,
    setAudioUrl,
    setAudioPlaying,
    setRecording,
  ])

  const stopRecording = useCallback(() => {
    mediaRecorder!.stop()
    setRecording(false)
  }, [mediaRecorder, setRecording])

  return (
    <Button
      variant={recording ? 'destructive' : 'secondary'}
      onClick={recording ? stopRecording : startRecording}
    >
      {recording ? (
        <Stop size={16} />
      ) : audioChunks.length ? (
        <Trash size={16} />
      ) : (
        <Mic size={16} />
      )}
    </Button>
  )
}
