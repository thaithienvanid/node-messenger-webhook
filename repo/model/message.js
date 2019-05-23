import { Schema } from 'mongoose'

import { mongoConnection } from '../mongo'

const messageSchema = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat'
    },
    from: {
      type: String
    },
    status: {
      type: String
    },
    payload: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
)

export const Message = mongoConnection.model(
  'Message',
  messageSchema,
  'message'
)
