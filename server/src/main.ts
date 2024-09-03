import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import helmet from 'helmet'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(helmet())

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidUnknownValues: true,
    }),
  )
  app.use(cookieParser())
  app.setGlobalPrefix('backend')

  const origin =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : `https://${process.env.APP_DOMAIN}`

  app.enableCors({
    origin,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  })

  await app.listen(process.env.PORT || 3001)
}

bootstrap()
