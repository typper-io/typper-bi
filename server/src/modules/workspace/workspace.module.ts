import { Module } from '@nestjs/common'
import { WorkspaceController } from 'src/modules/workspace/workspace.controller'
import { WorkspaceService } from 'src/modules/workspace/workspace.service'
import { PrismaModule } from 'src/modules/prisma/prisma.module'

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  imports: [PrismaModule],
})
export class WorkspaceModule {}
