import { Module } from '@nestjs/common'
import { DashboardController } from 'src/modules/dashboard/dashboard.controller'
import { DashboardService } from 'src/modules/dashboard/dashboard.service'
import { PrismaModule } from 'src/modules/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
