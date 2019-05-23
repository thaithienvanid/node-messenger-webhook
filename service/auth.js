import debug from 'debug'
const log = debug('app:server:service:auth')

import { redisClient } from '../repo/redis'

import { signJWT, verifyJWTSocket } from './token'

import passport from 'passport'
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt'
import { Strategy as FacebookStrategy } from 'passport-facebook'

import { fbConfig } from '../conf/fb'
import { jwtConfig } from '../conf/jwt'

log('fbConfig', fbConfig)
log('jwtConfig', jwtConfig)

import { User } from '../repo/model/user'

import { pageService } from '../service/page'

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfig.secret
    },
    async (payload, callback) => {
      try {
        const [[fail, json]] = await redisClient
          .multi()
          .get(`Session:${payload.id}`)
          .expire(`Session:${payload.id}`, jwtConfig.expire)
          .exec()
        if (!fail) {
          const user = JSON.parse(json)
          return callback(null, user)
        } else {
          return callback(fail, null)
        }
      } catch (error) {
        log('error', error)
        return callback(error, null)
      }
    }
  )
)

passport.use(
  new FacebookStrategy(
    {
      clientID: fbConfig.clientID,
      clientSecret: fbConfig.clientSecret,
      callbackURL: `/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      log('profile', profile)
      try {
        const user = await User.findOneAndUpdate(
          {
            fb_id: profile.id
          },
          {
            name: profile.displayName,
            email: profile.emails[0].value,
            fb_id: profile.id,
            fb_access_token: accessToken
          },
          { upsert: true, new: true }
        )
        if (user.fb_id) {
          await pageService.autoUpdateFacebookPage(user)
        }
        done(null, user)
      } catch (error) {
        log('error', error)
        done(error, null)
      }
    }
  )
)

const authJWT = async (req, res, next) => {
  log('authJWT')
  return passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/auth/facebook'
  })(req, res, next)
}

const authJWTSock = async (socket, next) => {
  log('authJWTSock')
  return await verifyJWTSocket(socket, next)
}

const authFacebook = async (req, res, next) => {
  log('authFacebook')
  return passport.authenticate('facebook', {
    session: false,
    scope: [
      'email',
      'manage_pages',
      'pages_show_list',
      'pages_messaging',
      'pages_messaging_subscriptions',
      'read_page_mailboxes',
      'business_management'
    ],
    authType: 'rerequest'
  })(req, res, next)
}

const authFacebookCallback = async (req, res, next) => {
  log('authFacebookCallback')
  return passport.authenticate(
    'facebook',
    {
      session: false,
      scope: [
        'email',
        'manage_pages',
        'pages_show_list',
        'pages_messaging',
        'pages_messaging_subscriptions',
        'read_page_mailboxes',
        'business_management'
      ],
      authType: 'rerequest'
    },
    async (error, user) => {
      if (error) {
        log('authFacebookCallback:error', error)
        res.redirect('/auth/facebook')
        return
      }
      log('authFacebookCallback:user', user)
      const token = await signJWT(user)
      res.redirect(`/?token=${token}`)
      return
    }
  )(req)
}

export const authService = {
  authJWT,
  authJWTSock,
  authFacebook,
  authFacebookCallback
}

export const authenticator = passport
