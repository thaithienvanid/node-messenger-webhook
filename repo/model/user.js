import { Schema } from 'mongoose'

import { mongoConnection } from '../mongo'

const userSchema = new Schema(
  {
    name: {
      type: String
    },
    email: {
      type: String
    },
    fb_id: {
      type: String
    },
    fb_access_token: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

export const User = mongoConnection.model('User', userSchema, 'user')
