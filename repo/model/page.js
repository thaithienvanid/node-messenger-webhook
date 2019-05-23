import { Schema } from 'mongoose'

import { mongoConnection } from '../mongo'

const pageSchema = new Schema(
  {
    name: {
      type: String
    },
    page_id: {
      type: String
    },
    page_type: {
      type: String
    },
    page_permissions: {
      type: [String]
    },
    page_access_token: {
      type: String
    },
    subscribed_apps_status: {
      type: Boolean
    }
  },
  {
    timestamps: true
  }
)

export const Page = mongoConnection.model('Page', pageSchema, 'page')
