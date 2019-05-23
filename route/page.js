import debug from 'debug'
const log = debug('app:server:route:page')

import { Router } from 'express'

import { authService } from '../service/auth'
import { pageService } from '../service/page'

log('pageService', pageService)

export const pageRouter = Router()

pageRouter.use(authService.authJWT)

pageRouter.get('/sync', pageService.syncPage)

pageRouter.get('/:pageId/subscribed_apps', pageService.subscribedApps)
