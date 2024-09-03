import type { NestMiddleware } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import * as bodyParser from 'body-parser'
import type { Request, Response } from 'express'

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => any) {
    bodyParser.raw({ type: '*/*' })(req, res, next)
  }
}
