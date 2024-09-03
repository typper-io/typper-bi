import { Module } from '@nestjs/common'
import { PrismaService } from 'src/modules/prisma/prisma.service'

@Module({
  exports: [PrismaService],
  providers: [PrismaService],
})
export class PrismaModule {}
