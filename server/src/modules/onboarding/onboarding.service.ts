import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'
import { randomUUID } from 'crypto'
import { CreateWorkspaceDto } from 'src/dto/create-workspace.dto'
import { PrismaService } from 'src/modules/prisma/prisma.service'
import { s3 } from 'src/singletons/aws'

@Injectable()
export class OnboardingService {
  constructor(private readonly prismaService: PrismaService) {}

  async listWorkspaces({ id }: User) {
    const userCompanies = await this.prismaService.userWorkspace.findMany({
      where: {
        userId: id,
      },
      include: {
        Workspace: {
          include: {
            UserWorkspace: true,
          },
        },
      },
    })

    return userCompanies.map(({ Workspace }) => {
      return {
        name: Workspace.name,
        id: Workspace.id,
        avatar: Workspace.avatar,
        members: Workspace.UserWorkspace.length,
      }
    })
  }

  async createWorkspace({
    file,
    name,
    user,
  }: CreateWorkspaceDto & {
    user: User
    file: Express.Multer.File
  }) {
    const publicUrl = await this.getFileUrl(file)

    const createdWorkspace = await this.prismaService.workspace.create({
      data: {
        name: name,
        avatar: publicUrl,
        UserWorkspace: {
          create: {
            userId: user.id,
          },
        },
      },
    })

    return createdWorkspace
  }

  private async getFileUrl(file: Express.Multer.File) {
    if (!file) return undefined

    const bucketName = process.env.WORKSPACE_IMAGES_BUCKET_NAME
    const filename = `${randomUUID()}.${file.mimetype.split('/')[1]}`

    const uploadParams = {
      Bucket: bucketName,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }

    const response = await s3.upload(uploadParams).promise()

    return response.Location
  }
}
