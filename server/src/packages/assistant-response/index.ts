import { AssistantStream } from 'openai/lib/AssistantStream'
import { formatStreamPart } from 'src/packages/assistant-response/stream-parts'
import {
  AssistantMessage,
  DataMessage,
} from 'src/packages/assistant-response/types'
import { Run } from 'openai/resources/beta/threads/runs/runs'
import { Readable } from 'stream'

type AssistantResponseSettings = {
  threadId: string
  messageId: string
}

type AssistantResponseCallback = (options: {
  messageId: string
  sendMessage: (message: AssistantMessage) => void
  sendDataMessage: (message: DataMessage) => void
  forwardStream: (stream: AssistantStream) => Promise<Run | undefined>
}) => Promise<void>

function webToNodeStream(webStream: ReadableStream<Uint8Array>): Readable {
  const nodeStream = new Readable({
    read() {
      // empty
    },
  })
  const reader = webStream.getReader()

  const pump = () => {
    reader
      .read()
      .then(({ done, value }) => {
        if (done) {
          nodeStream.push(null)
        } else {
          nodeStream.push(Buffer.from(value))
          pump()
        }
      })
      .catch((err) => {
        nodeStream.emit('error', err)
      })
  }

  pump()

  return nodeStream
}

export function AssistantResponse(
  { messageId, threadId }: AssistantResponseSettings,
  process: AssistantResponseCallback,
): Readable {
  const readableStream = new ReadableStream({
    async start(controller) {
      const textEncoder = new TextEncoder()

      const sendMessage = (message: AssistantMessage) => {
        controller.enqueue(
          textEncoder.encode(formatStreamPart('assistant_message', message)),
        )
      }

      const sendDataMessage = (message: DataMessage) => {
        controller.enqueue(
          textEncoder.encode(formatStreamPart('data_message', message)),
        )
      }

      const sendError = (errorMessage: string) => {
        controller.enqueue(
          textEncoder.encode(formatStreamPart('error', errorMessage)),
        )
      }

      const forwardStream = async (stream: AssistantStream) => {
        let result: Run | undefined = undefined

        for await (const value of stream) {
          switch (value.event) {
            case 'thread.message.created': {
              controller.enqueue(
                textEncoder.encode(
                  formatStreamPart('assistant_message', {
                    id: value.data.id,
                    role: 'assistant',
                    content: [{ type: 'text', text: { value: '' } }],
                  }),
                ),
              )
              break
            }

            case 'thread.message.delta': {
              const content = value.data.delta.content?.[0]

              if (content?.type === 'text' && content.text?.value != null) {
                controller.enqueue(
                  textEncoder.encode(
                    formatStreamPart('text', content.text.value),
                  ),
                )
              }

              break
            }

            case 'thread.run.completed':
            case 'thread.run.requires_action': {
              result = value.data
              break
            }
          }
        }

        return result
      }

      // send the threadId and messageId as the first message:
      controller.enqueue(
        textEncoder.encode(
          formatStreamPart('assistant_control_data', {
            threadId,
            messageId,
          }),
        ),
      )

      try {
        await process({
          messageId,
          sendMessage,
          sendDataMessage,
          forwardStream,
        })
      } catch (error) {
        sendError((error as any).message ?? `${error}`)
      } finally {
        controller.close()
      }
    },
    pull() {
      // do nothing
    },
    cancel() {
      // do nothing
    },
  })

  return webToNodeStream(readableStream)
}
