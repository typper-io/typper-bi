import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'
import { ThreadModule } from 'src/modules/thread/thread.module'
import { PrismaModule } from 'src/modules/prisma/prisma.module'
import { CredentialsModule } from 'src/modules/credentials/credentials.module'
import { ConnectorModule } from 'src/modules/connector/connector.module'
import { DashboardModule } from 'src/modules/dashboard/dashboard.module'
import { ReportModule } from 'src/modules/report/report.module'
import { SignInModule } from 'src/modules/sign-in/sign-in.module'
import { WorkspaceModule } from 'src/modules/workspace/workspace.module'
import { OnboardingModule } from 'src/modules/onboarding/onboarding.module'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { HealthController } from 'src/health.controller'
import { AllExceptionsFilter } from 'src/all-exception.filter'

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [new winston.transports.Console()],
    }),
    ThreadModule,
    PrismaModule,
    CredentialsModule,
    ConnectorModule,
    DashboardModule,
    ReportModule,
    SignInModule,
    WorkspaceModule,
    OnboardingModule,
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
