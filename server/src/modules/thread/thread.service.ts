import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common'
import { MessageLog, QueryLog, User } from '@prisma/client'
import { randomUUID } from 'crypto'
import { createReadStream, writeFileSync } from 'fs'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import OpenAI from 'openai'
import * as path from 'node:path'
import { RunThreadDto } from 'src/dto/run-thread.dto'
import { UpdateThreadDto } from 'src/dto/update-thread.dto'
import { ConnectorService } from 'src/modules/connector/connector.service'
import { PrismaService } from 'src/modules/prisma/prisma.service'
import { wrapQuery } from 'src/utils/wrap-query'
import { Logger } from 'winston'
import { IWorkspace } from 'src/interfaces/workspace'
import * as zod from 'zod'
import {
  DisplayReportType,
  RegisterUserFeedbackType,
  RunNaturalLanguageQueryType,
  SaveInformationType,
  SearchOnWebType,
  displayReportSchema,
  registerUserFeedbackSchema,
  runNaturalLanguageQuerySchema,
  saveInformationSchema,
  searchOnWebSchema,
} from 'src/modules/thread/validators'
import { Response } from 'express'
import { AssistantResponse } from 'src/packages/assistant-response'
import { Message } from 'src/packages/assistant-response/types'
import axios from 'axios'
import { isJson } from 'src/utils/is-json'
import { handleSchema } from 'src/utils/handle-schema'
import { sleep } from 'src/utils/sleep'
import { MessageCreateParams } from 'openai/resources/beta/threads/messages'
import { SemanticSearchService } from 'src/modules/semantic-search/semantic-search.service'
import Anthropic from '@anthropic-ai/sdk'
import { AssistantStream } from 'openai/lib/AssistantStream'

interface FunctionToolBaseArguments {
  threadId: string
  foundUser: User
  workspace: IWorkspace
}

type FunctionToolArguments<F> = FunctionToolBaseArguments & F

@Injectable({ scope: Scope.REQUEST })
export class ThreadService {
  private openai: OpenAI
  private anthropicAI: Anthropic

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly connectorService: ConnectorService,
    private readonly semanticSearchService: SemanticSearchService,
  ) {
    this.openai = new OpenAI()
    this.anthropicAI = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async runThreadMessage({
    text,
    threadId,
    workspace,
    user,
    response,
    files,
  }: {
    workspace: IWorkspace
    user: User
    response: Response
    files: Array<Express.Multer.File>
  } & RunThreadDto) {
    const { id: userId } = user

    const { externalThread, internalThread } = await this.getOrCreateThread({
      threadId,
      message: text,
      userId,
      workspaceId: workspace.workspaceId,
    })

    const attachmentsPromise: Array<Promise<MessageCreateParams.Attachment>> =
      files.map(async (file): Promise<MessageCreateParams.Attachment> => {
        const type = file.originalname.split('.').pop()
        const filename = `${randomUUID()}.${type}`
        const filePath = path.join(__dirname, `../../../tmp/${filename}`)

        writeFileSync(filePath, file.buffer)

        const fileUploaded = await this.openai.files.create({
          file: createReadStream(filePath),
          purpose: 'assistants',
        })

        return {
          file_id: fileUploaded.id,
          tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
        }
      })

    const attachments = await Promise.all(attachmentsPromise)

    const createdMessage = await this.openai.beta.threads.messages.create(
      externalThread.id,
      {
        role: 'user',
        content: text,
        attachments,
      },
    )

    await this.prismaService.message.create({
      data: {
        data: JSON.stringify({
          id: internalThread.id,
          role: 'user',
          created_at: new Date(createdMessage.created_at * 1000),
          content: text,
          attachments: files.map((file) => ({
            filename: file.originalname,
          })),
        }),
        threadId: internalThread.id,
      },
    })

    let additional_instructions = `<user_name>${user.name}</user_name>\n`

    if (user.userMemory) {
      additional_instructions += `<user_memory>${user.userMemory}\n</user_memory>`
    }

    const relatedMessages = await this.semanticSearchByRelatedPrompts({
      prompt: text,
      workspaceId: workspace.workspaceId,
    })

    if (relatedMessages.length) {
      const relatedMessagesText = relatedMessages
        .map((message) => {
          return `Prompt: "${message.prompt}" - Response: "${response}"`
        })
        .join('\n')

      additional_instructions += `<related_messages>${relatedMessagesText}</related_messages>\n`
    }

    additional_instructions += `<current_date>${new Date().toString()}</current_date>\n`

    const dataSources = await this.prismaService.dataSource.findMany({
      where: {
        workspaceId: workspace.workspaceId,
      },
    })

    const dataSourcesFormatted = dataSources.map((dataSource) => {
      let text = `Data Source: ${dataSource.name} (${dataSource.engine}) (${dataSource.description}) - ID: ${dataSource.id}.\n`

      text += `<data_source_context>${dataSource.context}</data_source_context>`

      if (dataSource.dataSourceMemory) {
        text += `<data_source_annotations>${dataSource.dataSourceMemory}</data_source_annotations>`
      }

      return text
    })

    additional_instructions += `<data_sources>${dataSourcesFormatted}</data_sources>\n`

    additional_instructions += `<workspace_annotations>${workspace.Workspace.workspaceMemory}</workspace_annotations>`

    const runStream = this.openai.beta.threads.runs.stream(externalThread.id, {
      assistant_id: workspace.Workspace.assistantId,
      additional_instructions,
    })

    const validators: Record<string, zod.ZodSchema<any>> = {
      run_nl_query: runNaturalLanguageQuerySchema,
      display_report: displayReportSchema,
      search_on_web: searchOnWebSchema,
      save_user_information: saveInformationSchema,
      save_workspace_information: saveInformationSchema,
      save_datasource_information: saveInformationSchema,
      register_user_feedback: registerUserFeedbackSchema,
    }

    const functions: Record<
      string,
      (data: FunctionToolArguments<any>) => Promise<{ assistant: string }>
    > = {
      run_nl_query: (data) => this.runNaturalLanguageQuerySchema(data),
      display_report: (data) => this.displayReport(data),
      search_on_web: (data) => this.searchOnWeb(data),
      save_user_information: (data) => this.saveUserInformation(data),
      save_workspace_information: (data) => this.saveWorkspaceInformation(data),
      save_datasource_information: (data) =>
        this.saveDataSourceInformation(data),
      register_user_feedback: (data) => this.registerUserFeedback(data),
    }

    const assistantResponse = AssistantResponse(
      { threadId: internalThread.id, messageId: createdMessage.id },
      async ({ forwardStream, sendDataMessage }) => {
        let runResult = await forwardStream(runStream)

        while (
          runResult?.status === 'requires_action' &&
          runResult.required_action?.type === 'submit_tool_outputs'
        ) {
          const toolOutputsPromise =
            runResult.required_action.submit_tool_outputs.tool_calls.map(
              async (toolCall: any) => {
                const { function: functionObject } = toolCall
                const { name: functionName, arguments: functionArguments } =
                  functionObject

                this.logger.info(`Running function ${functionName}`, {
                  arguments: functionArguments,
                })

                const functionsToNotNotify = ['register_user_feedback']

                const shouldNotify =
                  !functionsToNotNotify.includes(functionName)

                const schema = validators[functionName]

                if (!schema) {
                  this.logger.error(`Validator not found for ${functionName}`)

                  return {
                    tool_call_id: toolCall.id,
                    output: JSON.stringify({
                      error: `Validator not found for ${functionName}`,
                    }),
                  }
                }

                try {
                  schema.parse(JSON.parse(functionArguments))
                } catch (error) {
                  if (shouldNotify) {
                    sendDataMessage({
                      role: 'data',
                      id: toolCall.id,
                      data: {
                        output: {
                          error: error.message,
                        },
                        input: JSON.parse(functionArguments),
                        status: 'failed',
                        name: functionName,
                      },
                    })
                  }

                  this.logger.error(`Validation error for ${functionName}`, {
                    error,
                  })

                  return {
                    tool_call_id: toolCall.id,
                    output: JSON.stringify({
                      error: error.message,
                    }),
                  }
                }

                if (shouldNotify) {
                  sendDataMessage({
                    role: 'data',
                    id: toolCall.id,
                    data: {
                      output: {},
                      input: JSON.parse(functionArguments),
                      status: 'in_progress',
                      name: functionName,
                    },
                  })
                }

                const output = await functions[functionName]({
                  ...JSON.parse(functionArguments),
                  threadId: internalThread.id,
                  foundUser: user,
                  workspace,
                })

                this.logger.info(`Function ${functionName} output`, {
                  output,
                })

                if (shouldNotify) {
                  sendDataMessage({
                    role: 'data',
                    id: toolCall.id,
                    data: {
                      output: isJson(output.assistant)
                        ? JSON.parse(output.assistant)
                        : output.assistant,
                      input: isJson(functionArguments)
                        ? JSON.parse(functionArguments)
                        : functionArguments,
                      status: 'completed',
                      name: functionName,
                    },
                  })
                }

                return {
                  tool_call_id: toolCall.id,
                  output: output.assistant,
                }
              },
            )

          const toolOutputs = await Promise.all(toolOutputsPromise)

          const submitToolsStream =
            this.openai.beta.threads.runs.submitToolOutputsStream(
              externalThread.id,
              runResult.id,
              { tool_outputs: toolOutputs },
            )

          runResult = await forwardStream(submitToolsStream)
        }
      },
    )

    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Transfer-Encoding', 'chunked')

    this.saveUsage({
      runStream,
      threadId: externalThread.id,
      internalThreadId: internalThread.id,
    })

    assistantResponse.pipe(response, { end: false })
    assistantResponse.on('end', () => {
      response.end()
    })
  }

  private async saveUsage({
    runStream,
    threadId,
    internalThreadId,
  }: {
    runStream: AssistantStream
    threadId: string
    internalThreadId: string
  }) {
    while (!runStream.currentRun()) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    const runId = runStream.currentRun().id

    let run = await this.openai.beta.threads.runs.retrieve(threadId, runId)

    const notAllowedStatuses = [
      'queued',
      'in_progress',
      'cancelling',
      'requires_action',
    ]

    while (!run || notAllowedStatuses.includes(run.status)) {
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId)

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    const messages: Array<
      Message & {
        created_at: number
      }
    > = []

    const steps = await this.openai.beta.threads.runs.steps.list(
      threadId,
      runId,
    )

    for (const step of steps.data) {
      if (step.step_details.type === 'message_creation') {
        const message = await this.openai.beta.threads.messages.retrieve(
          threadId,
          step.step_details.message_creation.message_id,
        )

        if (message.content[0].type == 'text') {
          messages.push({
            content: message.content[0].text.value,
            annotations: message.content[0].text.annotations.map((annotation) =>
              JSON.stringify(annotation),
            ),
            id: step.id,
            role: message.role,
            created_at: message.created_at,
          })
        }
      }

      if (step.step_details.type === 'tool_calls') {
        for (const stepDetail of step.step_details.tool_calls) {
          if (stepDetail.type === 'function') {
            const allowedTollCalls = [
              'display_report',
              'run_nl_query',
              'search_on_web',
              'save_user_information',
              'save_workspace_information',
              'save_datasource_information',
            ]

            if (!allowedTollCalls.includes(stepDetail.function.name)) {
              continue
            }

            messages.push({
              role: 'data',
              data: {
                status: 'completed',
                input: isJson(stepDetail.function.arguments)
                  ? JSON.parse(stepDetail.function.arguments)
                  : stepDetail.function.arguments,
                output: isJson(stepDetail.function.output)
                  ? JSON.parse(stepDetail.function.output)
                  : stepDetail.function.output,
                name: stepDetail.function.name,
              },
              id: step.id,
              content: '',
              created_at: step.created_at,
            })
          }

          if (stepDetail.type === 'code_interpreter') {
            messages.push({
              role: 'data',
              data: {
                status: 'completed',
                input: {},
                output: {},
                name: 'code_interpreter',
              },
              id: step.id,
              content: '',
              created_at: step.created_at,
            })
          }

          if (stepDetail.type === 'file_search') {
            messages.push({
              role: 'data',
              data: {
                status: 'completed',
                input: {},
                output: {},
                name: 'retrieval',
              },
              id: step.id,
              content: '',
              created_at: step.created_at,
            })
          }
        }
      }
    }

    await this.prismaService.message.createMany({
      data: messages.map((message) => ({
        data: JSON.stringify(message),
        threadId: internalThreadId,
        createdAt: new Date(message.created_at * 1000),
      })),
    })
  }

  private async saveUserInformation({
    information,
    foundUser,
  }: FunctionToolArguments<SaveInformationType>) {
    const userMemory = foundUser.userMemory || '[]'

    const userMemoryAsArray = JSON.parse(userMemory as string)

    userMemoryAsArray.push(information)

    await this.prismaService.user.update({
      where: {
        id: foundUser.id,
      },
      data: {
        userMemory: JSON.stringify(userMemoryAsArray),
      },
    })

    return {
      assistant: JSON.stringify({ success: 'User information saved' }),
    }
  }

  private async saveWorkspaceInformation({
    information,
    workspace,
  }: FunctionToolArguments<SaveInformationType>) {
    const workspaceMemory = workspace.Workspace.workspaceMemory || '[]'

    const workspaceMemoryAsArray = JSON.parse(workspaceMemory as string)

    workspaceMemoryAsArray.push(information)

    await this.prismaService.workspace.update({
      where: {
        id: workspace.Workspace.id,
      },
      data: {
        workspaceMemory: JSON.stringify(workspaceMemoryAsArray),
      },
    })

    return {
      assistant: JSON.stringify({ success: 'Workspace information saved' }),
    }
  }

  private async saveDataSourceInformation({
    information,
    data_source_id: dataSourceId,
    workspace,
  }: FunctionToolArguments<SaveInformationType>) {
    const foundDataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId: workspace.Workspace.id,
      },
    })

    if (!foundDataSource) {
      return {
        assistant: JSON.stringify({ error: 'DataSource not found' }),
      }
    }

    const dataSourceMemory = foundDataSource.dataSourceMemory || '[]'

    const dataSourceMemoryAsArray = JSON.parse(dataSourceMemory as string)

    dataSourceMemoryAsArray.push(information)

    await this.prismaService.dataSource.update({
      where: {
        id: dataSourceId,
        workspaceId: workspace.Workspace.id,
      },
      data: {
        dataSourceMemory: JSON.stringify(dataSourceMemoryAsArray),
      },
    })

    return {
      assistant: JSON.stringify({ success: 'DataSource information saved' }),
    }
  }

  private async searchOnWeb({
    query,
    url,
  }: FunctionToolArguments<SearchOnWebType>) {
    try {
      if (url) {
        const { data } = await axios.get(`https://r.jina.ai/${url}`)

        return {
          assistant: data,
        }
      }

      const { data } = await axios.get(`https://s.jina.ai/${query}`)

      return {
        assistant: data,
      }
    } catch (error) {
      this.logger.error(error)

      return { assistant: JSON.stringify({ error: error.message }) }
    }
  }

  private async displayReport({
    report_type: reportType,
    report_name: reportName,
    report_description: reportDescription,
    query,
    dataSourceId,
    workspace,
  }: FunctionToolArguments<DisplayReportType>) {
    try {
      const sql = query.toLowerCase()

      const writeOperations = [
        'insert ',
        'update ',
        'delete ',
        'create ',
        'drop ',
        'alter ',
      ]

      if (writeOperations.some((operation) => sql.includes(operation))) {
        return {
          assistant: JSON.stringify({
            error: 'Write operations are not allowed',
          }),
        }
      }

      const wrappedQuery = wrapQuery({
        query: query,
        limit: 100,
      })

      const workspaceId = workspace.Workspace.id

      const dataSource = await this.prismaService.dataSource.findFirst({
        where: {
          id: dataSourceId,
          workspaceId,
        },
      })

      await this.connectorService.runQueryByProvider({
        provider: dataSource.engine,
        dataSourceId: dataSource.id,
        query: wrappedQuery,
      })

      return {
        assistant: JSON.stringify({
          success: 'The report will be displayed',
          reportName,
          reportDescription,
          reportType,
          query,
        }),
      }
    } catch (error) {
      this.logger.error(error)

      return { assistant: JSON.stringify({ error: error.message }) }
    }
  }

  private async runQuery({
    query,
    dataSourceId,
    workspace,
  }: {
    query: string
    dataSourceId: string
    workspace: IWorkspace
  }) {
    const sql = query.toLowerCase()

    const writeOperations = [
      'insert ',
      'update ',
      'delete ',
      'create ',
      'drop ',
      'alter ',
    ]

    if (writeOperations.some((operation) => sql.includes(operation))) {
      return {
        assistant: JSON.stringify({
          error: 'Write operations are not allowed',
        }),
      }
    }

    const wrappedQuery = wrapQuery({
      query: query,
      limit: 100,
    })

    const workspaceId = workspace.Workspace.id

    const dataSource = await this.prismaService.dataSource.findFirst({
      where: {
        id: dataSourceId,
        workspaceId,
      },
    })

    return this.connectorService.runQueryByProvider({
      provider: dataSource.engine,
      dataSourceId: dataSource.id,
      query: wrappedQuery,
    })
  }

  private async registerUserFeedback({
    query_log_id: queryLogId,
    intent,
    type,
    workspace,
    feedback: userFeedback,
    response,
    prompt,
  }: FunctionToolArguments<RegisterUserFeedbackType>) {
    if (type === 'query') {
      const feedback: Partial<
        Pick<QueryLog, 'positiveFeedback' | 'negativeFeedback' | 'useAsExample'>
      > =
        intent === 'positive'
          ? {
              positiveFeedback: userFeedback,
            }
          : {
              negativeFeedback: userFeedback,
              useAsExample: false,
            }

      await this.prismaService.queryLog.update({
        where: {
          id: queryLogId,
          workspaceId: workspace.Workspace.id,
        },
        data: feedback,
      })
    }

    if (type === 'response') {
      const feedback: Partial<
        Pick<
          MessageLog,
          'positiveFeedback' | 'negativeFeedback' | 'useAsExample'
        >
      > =
        intent === 'positive'
          ? {
              positiveFeedback: userFeedback,
              useAsExample: true,
            }
          : {
              negativeFeedback: userFeedback,
            }

      await this.prismaService.messageLog.create({
        data: {
          ...feedback,
          response,
          prompt,
          workspaceId: workspace.Workspace.id,
        },
      })
    }

    return {
      assistant: JSON.stringify({ success: 'Feedback saved' }),
    }
  }

  private async semanticSearchByRelatedPrompts({
    prompt,
    workspaceId,
  }: {
    workspaceId: string
    prompt: string
  }) {
    const messageLogs = await this.prismaService.messageLog.findMany({
      where: {
        workspaceId,
        useAsExample: true,
      },
    })

    const documents = messageLogs.map((messageLog) => messageLog.prompt)

    const results = await this.semanticSearchService.semanticSearch({
      query: prompt,
      documents,
    })

    const messages = messageLogs.filter((messageLog) => {
      return results.some((result) => result.document === messageLog.prompt)
    })

    return messages
  }

  private async runNaturalLanguageQuerySchema({
    natural_language_query,
    dataSource_id,
    workspace,
    count = 0,
    errorMessage,
    previousQuery,
    ...rest
  }: FunctionToolArguments<RunNaturalLanguageQueryType> & {
    count: number
    errorMessage: string
    previousQuery: string
  }) {
    try {
      const dataSource = await this.prismaService.dataSource.findFirst({
        where: {
          id: dataSource_id,
          workspaceId: workspace.Workspace.id,
        },
      })

      if (!dataSource) {
        return {
          assistant: JSON.stringify({ error: 'DataSource not found' }),
        }
      }

      let system = 'You are a data analysis expert.'

      system += '<instructions>\n'
      system += '1. Give the necessary SQL to user prompt.\n'
      system += '2. If the previous query failed, fix the error.\n'
      system += '3. Always use database schema in the query.\n'
      system +=
        '4. Create the most generic query possible, because the user can make mistakes in information.\n'
      system +=
        '5. Prefer use ID, if don\t have an ID, use ilike for text fields with a single part of the text using %.\n'
      system += '</instructions>\n'

      let userMsg = ''
      userMsg += `<prompt>${natural_language_query}</prompt>\n`

      if (count > 0) {
        userMsg += `<query_with_error>${previousQuery}</query_with_error>\n<error_message>${errorMessage}</error_message>\n`
      }

      userMsg += `<datasource_engine>${dataSource.engine}</datasource_engine>\n`

      if (dataSource.dataSourceMemory) {
        userMsg += `<datasource_memory>${dataSource.dataSourceMemory}</datasource_memory>\n`
      }

      if (dataSource.context) {
        userMsg += `<datasource_context>${dataSource.context}</datasource_context>\n`
      }

      const relatedQueries = await this.semanticSearchByRelatedQueries({
        dataSourceId: dataSource_id,
        prompt: natural_language_query,
        workspaceId: workspace.Workspace.id,
      })

      if (relatedQueries.length) {
        const relatedQueriesText = relatedQueries
          .map((query) => {
            return `Prompt: "${query.prompt}" - SQL: "${query.query}"`
          })
          .join('\n')

        userMsg += `<example_queries>"${relatedQueriesText}"</example_queries>\n`
      }

      this.logger.info(
        `Running natural language query: ${natural_language_query}`,
        {
          systemPrompt: system,
          userPrompt: userMsg,
        },
      )

      const handledSchema = handleSchema({
        engine: dataSource.engine,
        schema: JSON.parse(dataSource.schema as string),
      })

      const stringifiedSchema = JSON.stringify(handledSchema)

      userMsg += `<data_source_schema>${stringifiedSchema}</data_source_schema>\n`

      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: system,
          },
          {
            role: 'user',
            content: userMsg,
          },
        ],
        model: 'gpt-4o-mini',
      })

      const rawMessage = completion.choices[0].message.content || ''

      let rows: Array<any> = []

      const getSQL = /```.*?\n([\s\S]*?)\n```/g

      const query = getSQL.exec(rawMessage)[1]

      const queryLog = await this.prismaService.queryLog.create({
        data: {
          dataSourceId: dataSource_id,
          prompt: natural_language_query,
          query,
          success: false,
          workspaceId: workspace.Workspace.id,
        },
      })

      try {
        this.logger.info(`Running query: ${query}`)

        rows = await this.runQuery({
          query,
          dataSourceId: dataSource_id,
          workspace,
        })

        await this.prismaService.queryLog.update({
          where: {
            id: queryLog.id,
            workspaceId: workspace.Workspace.id,
          },
          data: {
            success: true,
          },
        })
      } catch (error: any) {
        this.logger.error(error.message)

        await this.prismaService.queryLog.update({
          where: {
            id: queryLog.id,
            workspaceId: workspace.Workspace.id,
          },
          data: {
            errorMessage: error.message,
            useAsExample: false,
          },
        })

        if (count >= 5) {
          return {
            assistant: JSON.stringify({
              query,
              error:
                "Query failed, please return to user the feedback and don't run the query again. Probably is a system error.",
              queryLogId: queryLog.id,
            }),
          }
        }

        await sleep(2000)

        return this.runNaturalLanguageQuerySchema({
          natural_language_query,
          dataSource_id,
          workspace,
          count: count + 1,
          errorMessage: error.message,
          previousQuery: query,
          ...rest,
        })
      }

      return {
        assistant: JSON.stringify({ query, rows, queryLogId: queryLog.id }),
      }
    } catch (error) {
      this.logger.error(error.message)

      return { assistant: JSON.stringify({ error: error.message }) }
    }
  }

  private async semanticSearchByRelatedQueries({
    dataSourceId,
    prompt,
    workspaceId,
  }: {
    dataSourceId: string
    workspaceId: string
    prompt: string
  }) {
    const queryLogs = await this.prismaService.queryLog.findMany({
      where: {
        dataSourceId,
        workspaceId,
        success: true,
        useAsExample: true,
      },
    })

    const documents = queryLogs.map((queryLog) => queryLog.prompt)

    const results = await this.semanticSearchService.semanticSearch({
      query: prompt,
      documents,
    })

    const queries = queryLogs.filter((queryLog) => {
      return results.some((result) => result.document === queryLog.prompt)
    })

    return queries
  }

  private async getOrCreateThread({
    threadId,
    userId,
    message,
    workspaceId,
  }: {
    threadId?: string
    userId: string
    message: string
    workspaceId: string
  }) {
    if (threadId) {
      const thread = await this.prismaService.thread.findUnique({
        where: {
          id: threadId,
          ownerId: userId,
          workspaceId,
        },
      })

      if (!thread) {
        throw new NotFoundException('Thread not found')
      }

      const { externalThreadId: aiThread } = thread

      return {
        externalThread: await this.openai.beta.threads.retrieve(aiThread),
        internalThread: thread,
      }
    }

    const thread = await this.openai.beta.threads.create({})

    const title = await this.getTitle({ message })

    const createdThread = await this.prismaService.thread.create({
      data: {
        externalThreadId: thread.id,
        title,
        ownerId: userId,
        workspaceId,
      },
    })

    return { externalThread: thread, internalThread: createdThread }
  }

  private async getTitle({
    message,
    count = 1,
  }: {
    message: string
    count?: number
  }) {
    try {
      if (count >= 4) {
        return 'Helping with SQL queries'
      }

      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant designed to output JSON a unique key "title" with a title based on user message.',
          },
          {
            role: 'user',
            content: `The user message is: "${message}", create a title. And return the same object structure: ${JSON.stringify(
              { title: '' },
            )}`,
          },
        ],
        model: 'gpt-3.5-turbo',
        response_format: { type: 'json_object' },
      })

      const title = JSON.parse(completion.choices[0].message.content)?.title

      if (!title) {
        await sleep(2000)

        return this.getTitle({ message, count: count + 1 })
      }

      return title
    } catch (error) {
      this.logger.error(error)

      await sleep(2000)

      return this.getTitle({ message, count: count + 1 })
    }
  }

  async deleteThread({ threadId, id: userId }: User & { threadId: string }) {
    const thread = await this.prismaService.thread.findUnique({
      where: {
        ownerId: userId,
        id: threadId,
      },
    })

    if (!thread) {
      throw new NotFoundException('Thread not found')
    }

    await this.openai.beta.threads
      .del(thread.externalThreadId)
      .catch((error) => {
        this.logger.error(error)
      })

    await this.prismaService.message.deleteMany({
      where: {
        threadId: thread.id,
      },
    })

    await this.prismaService.thread.delete({
      where: {
        id: thread.id,
        ownerId: userId,
      },
    })
  }

  async updateThread({
    title,
    threadId,
    id: userId,
  }: User & UpdateThreadDto & { threadId: string }) {
    const thread = await this.prismaService.thread.findUnique({
      where: {
        ownerId: userId,
        id: threadId,
      },
    })

    if (!thread) {
      throw new NotFoundException('Thread not found')
    }

    await this.prismaService.thread.update({
      data: {
        title,
      },
      where: {
        id: thread.id,
        ownerId: userId,
      },
    })
  }
}
