import debug from 'debug'
const log = debug('app:server:service:socket')

import _ from 'lodash'

import FB from 'fb'

import { Chat } from '../repo/model/chat'
import { Message } from '../repo/model/message'

import { redisClient, redisPubClient, redisSubClient } from '../repo/redis'

import SocketIORedis from 'socket.io-redis'
import SocketIOEmitter from 'socket.io-emitter'

export const socketIORedis = SocketIORedis({
  pubClient: redisPubClient,
  subClient: redisSubClient
})

export const socketIOEmitter = SocketIOEmitter(redisClient)

export const sendMessageToAdmin = async (admin, message) => {
  log('sendMessageToAdmin')
  try {
    let sockets = await redisClient.keys(`Socket:${admin._id}:*`)
    sockets = sockets.map(socket => socket.replace(`Socket:${admin._id}:`, ''))
    sockets.forEach(async socket => {
      await socketIOEmitter.to(socket).emit(`chat`, message)
    })
  } catch (error) {
    log('sendMessageToAdmin:error', error)
  }
}

export const sendMessageToAdminExcept = async (current, admin, message) => {
  log('sendMessageToAdminExcept')
  try {
    let sockets = await redisClient.keys(`Socket:${admin._id}:*`)
    sockets = sockets.map(socket => socket.replace(`Socket:${admin._id}:`, ''))
    sockets
      .filter(socket => socket !== current)
      .forEach(async socket => {
        await socketIOEmitter.to(socket).emit(`chat`, message)
      })
  } catch (error) {
    log('sendMessageToAdmin:error', error)
  }
}

export const sendMessageToPage = async message => {
  log('sendMessageToPage')
  try {
    log('message', message)

    if (!_.get(message, 'chat')) {
      return
    }

    if (!_.get(message, 'payload')) {
      return
    }

    const chat = await Chat.findOne({
      _id: message.chat,
      status: 'open'
    })
      .populate('page')
      .populate('guest')

    log('chat', chat)

    if (!chat) {
      return
    }

    if (!_.get(chat, ['page', 'page_id'])) {
      return
    }

    if (!_.get(chat, ['page', 'page_access_token'])) {
      return
    }

    if (!_.get(chat, ['guest', 'psid'])) {
      return
    }

    await FB.api(
      `/${_.get(chat, ['page', 'page_id'])}/messages?access_token=${_.get(
        chat,
        ['page', 'page_access_token']
      )}`,
      'post',
      {
        messaging_type: 'RESPONSE',
        recipient: {
          id: _.get(chat, ['guest', 'psid'])
        },
        message: message.payload
      }
    )

    await Message.create({
      chat: chat._id,
      from: 'admin',
      status: 'received',
      payload: message.payload
    })
  } catch (error) {
    log('sendMessageToPage:error', error)
  }
}
