export enum Role {
  ASSISTANT = 'assistant',
  USER = 'user',
}

export enum StepType {
  MESSAGE_CREATION = 'message_creation',
  TOOL_CALLS = 'tool_calls',
}

export interface Thread {
  id: string
  title: string
  userId: string
  dataSourceId: string
  threadId: string | null
  createdAt: Date | null
  updatedAt: Date | null
  dataSource: {
    name: string
  }
}

export interface MessageTool {
  id: string
  created_at: number
  type: StepType.TOOL_CALLS
  input: string
  output: string
  name: string
  status: string
}

export interface MessageCreation {
  id: string
  role: Role
  created_at: number
  type: StepType.MESSAGE_CREATION
  content: string
  status: string
}

export interface UserMessageCreation extends MessageCreation {
  role: Role.USER
  avatar: string
}

export interface AssistantMessageCreation {
  id: string
  role: Role.ASSISTANT
  created_at: number
  content: Array<MessageCreation | MessageTool>
}

export type ThreadRetrieve = Array<
  UserMessageCreation | AssistantMessageCreation
>
