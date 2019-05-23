import debug from 'debug'
const log = debug('app:server')

import http from 'http'
import path from 'path'

import express from 'express'

import cors from 'cors'
import helmet from 'helmet'

import bodyParser from 'body-parser'

import SocketIO from 'socket.io'

import { mongoConnection } from './repo/mongo'
import {
  redisClient,
  openRedisConnection,
  closeRedisConnection
} from './repo/redis'

import {
  socketIORedis,
  socketIOEmitter,
  sendMessageToAdminExcept,
  sendMessageToPage
} from './service/socket'

import { authenticator, authService } from './service/auth'

import { authRouter } from './route/auth'
import { userRouter } from './route/user'
import { pageRouter } from './route/page'
import { hookRouter } from './route/hook'

const PORT = process.env.PORT || 8080

const app = express()
const server = http.createServer(app)
const socketIO = SocketIO(server)

socketIO.adapter(socketIORedis)
socketIO.use(authService.authJWTSock)

app.use(cors())
app.use(helmet())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(authenticator.initialize())

app.use('/', express.static(path.resolve('<client>')))

app.use('/auth', authRouter)

app.use('/user', userRouter)

app.use('/page', pageRouter)

app.use('/webhook/messenger', hookRouter)

app.use(async (err, req, res, next) => {
  log(`Application:error: ${err}`)
  res.status(200).json({
    code: 1,
    message: err.message || 'Internal Server Error',
    payload: err
  })
})

socketIO.on('connection', async socket => {
  log('socket', socket.id)
  const { user } = socket

  if (user) {
    await redisClient
      .multi()
      .set(`Socket:${user._id}:${socket.id}`, socket.id)
      .expire(`Socket:${user._id}:${socket.id}`, 1 * 60 * 60)
      .exec()
  }

  socket.on('chat', async message => {
    log('data', message)
    const { user } = socket
    await sendMessageToPage(message)
    await sendMessageToAdminExcept(socket.id, user, message)
  })
})

const startUp = async () => {
  try {
    await new Promise((resolve, reject) => {
      mongoConnection.on('open', () => {
        resolve()
      })
    })
    log(`mongoConnection is opened`)

    await openRedisConnection()
    log(`redisConnection is opened`)

    await openElasticConnection()
    log(`elasticConnection is opened`)

    await server.listen(PORT, () => {
      log(`Application started on port: ${PORT}`)
    })
  } catch (error) {
    log('startUp', error)
    process.emit('SIGINT')
  }
}

const cleanUp = async () => {
  try {
    await mongoConnection.close()
    log('mongoConnection is closed')

    await closeRedisConnection()
    log(`redisConnection is closed`)

    await elasticConnection.close()
    log(`elasticConnection is closed`)

    await server.close()
    log(`Application closed on port: ${PORT}`)

    process.exit(0)
  } catch (error) {
    log('cleanUp', error)
    process.exit(0)
  }
}

startUp()

process.on('rejectionHandled', async error => {
  log('rejectionHandled', error)
  await cleanUp()
})

process.on('uncaughtException', async error => {
  log('uncaughtException', error)
  await cleanUp()
})

process.on('SIGINT', async () => {
  log('SIGINT')
  await cleanUp()
})
