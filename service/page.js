import debug from 'debug'
const log = debug('app:server:service:page')

import { Page } from '../repo/model/page'
import { Manage } from '../repo/model/manage'

import { elasticConnection } from '../repo/elastic'

import FB from 'fb'

const autoUpdateFacebookPage = async user => {
  try {
    const response = await FB.api(
      `/${user.fb_id}/accounts?access_token=${user.fb_access_token}`
    )
    log('autoUpdateFacebookPage:response', response)
    for (const elm of response.data) {
      const page = await Page.findOneAndUpdate(
        {
          page_id: elm.id,
          page_type: 'facebook'
        },
        {
          name: elm.name,
          page_id: elm.id,
          page_type: 'facebook',
          page_permissions: elm.tasks,
          page_access_token: elm.access_token
        },
        {
          upsert: true,
          new: true
        }
      )
      log('page', page)
      const manage = await Manage.findOneAndUpdate(
        {
          page: page._id
        },
        {
          page: page._id,
          admin: user._id
        },
        {
          upsert: true,
          new: true
        }
      )
      log('manage', manage)
      const status = await elasticConnection.indices.exists({
        index: `${page._id}`
      })
      if (!status) {
        await elasticConnection.indices.create(`${page._id}`)
        await elasticConnection.indices.putMapping({
          index: `${page._id}`,
          type: 'intent',
          body: {
            properties: {
              intent: {
                type: 'string'
              },
              speechs: {
                type: 'string'
              },
              response: {
                type: 'string'
              }
            }
          }
        })
      }
    }
    return response.data
  } catch (error) {
    log('autoUpdateFacebookPage:error', error)
    return []
  }
}

const syncPage = async (req, res, next) => {
  log('syncPage')
  try {
    const { user } = req
    const pages = await autoUpdateFacebookPage(user)
    res.status(200).json({
      code: 0,
      message: 'OK',
      payload: pages
    })
  } catch (error) {
    log('syncPage:error', error)
    next(error)
  }
}

const subscribedApps = async (req, res, next) => {
  // TODO
  res.status(200).json({
    code: 0,
    message: 'OK'
  })
}

export const pageService = {
  syncPage,
  subscribedApps,
  autoUpdateFacebookPage
}
