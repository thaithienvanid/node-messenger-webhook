import { Schema } from 'mongoose'

import { mongoConnection } from '../mongo'

const chatSchema = new Schema(
  {
    page: {
      type: Schema.Types.ObjectId,
      ref: 'Page'
    },
    status: {
      type: String
    },
    rating: {
      type: Number
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: 'Guest'
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

export const Chat = mongoConnection.model('Chat', chatSchema, 'chat')
