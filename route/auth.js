import debug from 'debug'
const log = debug('app:server:route:auth')

import { Router } from 'express'

import { authService } from '../service/auth'

log('authService', authService)

export const authRouter = Router()

authRouter.get('/facebook', authService.authFacebook)

authRouter.get('/facebook/callback', authService.authFacebookCallback)
