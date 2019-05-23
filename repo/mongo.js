import debug from 'debug'
const log = debug('app:server:repo:mongo')

import mongoose from 'mongoose'

import { mongoConfig } from '../conf/repo'

log('mongoConfig', mongoConfig)

export const mongoConnection = mongoose.createConnection(mongoConfig.uri, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  socketTimeoutMS: 0,
  keepAlive: true,
  reconnectTries: 30
})

mongoConnection.on('error', error => {
  log('Mongo connection is errored', error)
})
