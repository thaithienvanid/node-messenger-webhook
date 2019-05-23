import debug from 'debug'
const log = debug('app:server:route:user')

import { Router } from 'express'

import { authService } from '../service/auth'
import { userService } from '../service/user'

log('userService', userService)

export const userRouter = Router()

userRouter.use(authService.authJWT)
