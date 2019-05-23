import debug from 'debug'
const log = debug('app:server:utility:jwt')

import jwt from 'jsonwebtoken'
import { jwtConfig } from '../conf/jwt'

import { ExtractJwt } from 'passport-jwt'

import { redisClient } from '../repo/redis'

export const signJWT = async user => {
  log('signJWT')
  try {
    const token = jwt.sign({ id: user._id }, jwtConfig.secret)
    log('token', token)
    await redisClient
      .multi()
      .set(`Session:${user._id}`, JSON.stringify(user))
      .expire(`Session:${user._id}`, jwtConfig.expire)
      .exec()
    return token
  } catch (error) {
    log('signJWT:error', error)
    return null
  }
}

export const verifyJWTSocket = async (socket, next) => {
  log('verifyJWTSocket')

  socket['jwt'] = undefined
  socket['user'] = undefined

  const { request } = socket

  const token = ExtractJwt.fromUrlQueryParameter('token')(request)
  log('token', token)

  if (!token) {
    setTimeout(() => {
      socket.emit('unauthorized', {
        code: 1,
        message: 'Token not found'
      })
      socket.disconnect('unauthorized')
    }, 1000)
    next()
    return
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret)

    const [[fail, json]] = await redisClient
      .multi()
      .get(`Session:${decoded.id}`)
      .expire(`Session:${decoded.id}`, jwtConfig.expire)
      .exec()

    if (!fail) {
      const user = JSON.parse(json)
      socket['jwt'] = token
      socket['user'] = user
    } else {
      setTimeout(() => {
        socket.emit('unauthorized', {
          code: 1,
          message: 'Session not found'
        })
        socket.disconnect('unauthorized')
      }, 1000)
    }
  } catch (error) {
    log('verifyJWT:error', error)
    setTimeout(() => {
      socket.emit('unauthorized', {
        code: 1,
        message: error.message,
        payload: error
      })
      socket.disconnect('unauthorized')
    }, 1000)
  }
  next()
  return
}
