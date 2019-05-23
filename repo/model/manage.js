import { Schema } from 'mongoose'

import { mongoConnection } from '../mongo'

const manageSchema = new Schema(
  {
    page: {
      type: Schema.Types.ObjectId,
      ref: 'Page'
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

export const Manage = mongoConnection.model('Manage', manageSchema, 'manage')
