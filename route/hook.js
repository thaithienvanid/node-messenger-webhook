import debug from 'debug'
const log = debug('app:server:route:hook')

import { Router } from 'express'

import { hookService } from '../service/hook'

export const hookRouter = Router()

hookRouter.get('/', hookService.messengerVerification)

hookRouter.post('/', hookService.messengerEventHandler)
