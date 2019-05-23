import debug from 'debug'
const log = debug('app:server:repo:redis')

import IORedis from 'ioredis'

import { redisConfig } from '../conf/repo'

export const redisClient = new IORedis({
  host: redisConfig.host,
  port: redisConfig.port,
  lazyConnect: true
})

export const redisPubClient = new IORedis({
  host: redisConfig.host,
  port: redisConfig.port,
  lazyConnect: true
})

export const redisSubClient = new IORedis({
  host: redisConfig.host,
  port: redisConfig.port,
  lazyConnect: true
})

const open = async client => {
  new Promise((resolve, reject) => {
    client.on('ready', () => {
      return resolve()
    })
    client.on('error', error => {
      return reject(error)
    })
    setTimeout(() => {
      if (!['connect', 'connecting', 'ready'].includes(client.status)) {
        client.connect()
      }
    }, 500)
  })
}

export const openRedisConnection = async () => {
  await open(redisClient)
  await open(redisPubClient)
  await open(redisSubClient)
}

export const closeRedisConnection = async () => {
  await redisClient.disconnect()
  await redisPubClient.disconnect()
  await redisSubClient.disconnect()
}

redisClient.on('error', error => {
  log('redisClient is errored', error)
})

redisPubClient.on('error', error => {
  log('redisPubClient is errored', error)
})

redisSubClient.on('error', error => {
  log('redisSubClient is errored', error)
})
