import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Param,
  Post,
  Put,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { Auth } from 'src/decorators/auth.decorator'
import { User } from 'src/decorators/user.decorator'
import { User as PrismaUser } from '@prisma/client'
import { RunThreadDto } from 'src/dto/run-thread.dto'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ThreadService } from 'src/modules/thread/thread.service'
import { UpdateThreadDto } from 'src/dto/update-thread.dto'
import { IWorkspace } from 'src/interfaces/workspace'
import { Workspace } from 'src/decorators/workspace.decorator'
import { Response } from 'express'
import { allowedThreadFiles } from 'src/constants/allowed-thread-files'

@Auth()
@Controller()
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post('/thread')
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      limits: {
        fileSize: 1024 * 1024 * 200,
      },
      fileFilter(_req, file, callback) {
        if (!allowedThreadFiles.includes(file.mimetype)) {
          return callback(
            new ForbiddenException('File type not allowed!'),
            false,
          )
        }

        callback(null, true)
      },
    }),
  )
  async thread(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() runThreadDto: RunThreadDto,
    @User() user: PrismaUser,
    @Workspace() workspace: IWorkspace,
    @Res() response: Response,
  ) {
    return this.threadService.runThreadMessage({
      ...runThreadDto,
      workspace,
      user,
      response,
      files,
    })
  }

  @Delete('/thread/:threadId')
  async deleteThread(
    @Param('threadId') threadId: string,
    @User() user: PrismaUser,
  ) {
    return this.threadService.deleteThread({ threadId, ...user })
  }

  @Put('/thread/:threadId')
  async updateThread(
    @Param('threadId') threadId: string,
    @User() user: PrismaUser,
    @Body() body: UpdateThreadDto,
  ) {
    return this.threadService.updateThread({ threadId, ...body, ...user })
  }
}
