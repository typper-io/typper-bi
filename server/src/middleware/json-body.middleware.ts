import type { NestMiddleware } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import * as bodyParser from 'body-parser'
import type { Request, Response } from 'express'

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => any) {
    bodyParser.json({
      limit: '150mb',
    })(req, res, next)
  }
}
