import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/modules/prisma/prisma.module'
import { ReportController } from 'src/modules/report/report.controller'
import { ReportService } from 'src/modules/report/report.service'

@Module({
  controllers: [ReportController],
  providers: [ReportService],
  imports: [PrismaModule],
})
export class ReportModule {}
