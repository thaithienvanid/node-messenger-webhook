import { Schema } from 'mongoose'

import { mongoConnection } from '../mongo'

const guestSchema = new Schema(
  {
    psid: {
      type: String
    },
    name: {
      type: String
    },
    profile_pic: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

export const Guest = mongoConnection.model('Guest', guestSchema, 'guest')
