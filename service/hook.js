import debug from 'debug'
const log = debug('app:server:service:hook')

import { fbConfig } from '../conf/fb'

import _ from 'lodash'

import FB from 'fb'

import { Chat } from '../repo/model/chat'
import { Page } from '../repo/model/page'
import { Guest } from '../repo/model/guest'
import { Manage } from '../repo/model/manage'
import { Message } from '../repo/model/message'

import { sendMessageToAdmin } from './socket'

const messengerVerification = async (req, res, next) => {
  let mode = req.query['hub.mode']
  let token = req.query['hub.verify_token']
  let challenge = req.query['hub.challenge']

  if (mode && token) {
    if (mode === 'subscribe' && token === fbConfig.verifyToken) {
      log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      res.sendStatus(403)
    }
  }
}

const messengerEventHandler = async (req, res, next) => {
  let body = req.body
  if (body.object === 'page') {
    body.entry.forEach(async entry => {
      let messaging_events = entry.messaging
      if (messaging_events) {
        log('messaging_events', messaging_events)
        messaging_events.forEach(async event => {
          log('event', event)
          await processMessageEvent(event)
        })
      }
    })
    res.status(200).send('EVENT_RECEIVED')
  } else {
    res.sendStatus(404)
  }
}

const processMessageEvent = async event => {
  log('processMessageEvent')

  const page_id = _.get(event, ['recipient', 'id'])
  log('page_id', page_id)

  const page = await Page.findOne({
    page_id: page_id
  })

  if (!page) {
    return
  }

  const psid = _.get(event, ['sender', 'id'])
  log('psid', psid)

  if (!psid) {
    return
  }

  log(
    `/${psid}?fields=id,name,profile_pic&access_token=${page.page_access_token}`
  )

  const data = await FB.api(
    `/${psid}?fields=id,name,profile_pic&access_token=${page.page_access_token}`
  )

  if (!data || !data.id || !data.name || !data.profile_pic) {
    return
  }

  const guest = await Guest.findOneAndUpdate(
    {
      psid: data.id
    },
    {
      psid: data.id,
      name: data.name,
      profile_pic: data.profile_pic
    },
    {
      upsert: true,
      new: true
    }
  )

  if (!guest) {
    return
  }

  const chat = await Chat.findOneAndUpdate(
    {
      page: page._id,
      guest: guest._id,
      status: 'open'
    },
    {
      page: page._id,
      guest: guest._id,
      status: 'open'
    },
    {
      upsert: true,
      new: true
    }
  )

  if (!chat) {
    return
  }

  const text = getEventText(event)

  if (!text) {
    return
  }

  log('text', text)
  const message = await Message.create({
    chat: chat._id,
    from: 'guest',
    status: 'received',
    payload: {
      text: text
    }
  })

  if (!message) {
    return
  }

  const admins = await Manage.find({
    page: page._id
  }).populate('admin')

  if (!admins) {
    return
  }

  admins.forEach(async admin => {
    await sendMessageToAdmin(admin, message)
  })
}

const getEventText = event => {
  if (_.get(event, ['message', 'quick_reply', 'payload'])) {
    return _.get(event, ['message', 'quick_reply', 'payload'])
  }

  if (_.get(event, ['message', 'text'])) {
    return _.get(event, ['message', 'text'])
  }

  if (_.get(event, ['message', 'postback', 'payload'])) {
    return _.get(event, ['message', 'postback', 'payload'])
  }

  return undefined
}

export const hookService = {
  messengerVerification,
  messengerEventHandler
}
