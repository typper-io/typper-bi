import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { User } from 'src/decorators/user.decorator'
import { User as PrismaUser } from '@prisma/client'
import { OnboardingAuth } from 'src/decorators/onboarding-auth.decorator'
import { FileInterceptor } from '@nestjs/platform-express'
import { CreateWorkspaceDto } from 'src/dto/create-workspace.dto'
import { OnboardingService } from 'src/modules/onboarding/onboarding.service'

@OnboardingAuth()
@Controller()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('/workspaces')
  async listWorkspaces(@User() user: PrismaUser) {
    return this.onboardingService.listWorkspaces(user)
  }

  @Post('/workspace')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: {
        files: 1,
        fileSize: 1024 * 1024 * 5,
      },
      fileFilter(_req, file, callback) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif']

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new ForbiddenException('Only image files are allowed!'),
            false,
          )
        }

        callback(null, true)
      },
    }),
  )
  async createWorkspace(
    @User() user: PrismaUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateWorkspaceDto,
  ) {
    return this.onboardingService.createWorkspace({
      file,
      user,
      ...body,
    })
  }
}
