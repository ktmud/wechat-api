var Client = require('./client')
var qs = require('querystring')

function api(method, url) {
  return function(data, fn) {
    return this._request(method, url, data, fn)
  }
}

Client.prototype.createMenu = api('POST', '/menu/create')
Client.prototype.getMenu = api('GET', '/menu/get')
Client.prototype.deleteMenu = api('GET', '/menu/delete')
Client.prototype.getUserInfo = api('GET', '/user/info')
Client.prototype.getUserList = api('GET', '/user/get')

Client.prototype.createQRCode = api('POST', '/qrcode/create')
Client.prototype.createTempQRCode = function(scene_id, expires_seconds, callback) {
  if ('function' == typeof expires_seconds) {
    callback = expires_seconds
    expires_seconds = null
  }
  return this.createQRCode({
    expires_seconds: expires_seconds || 1800,
    action_name: 'QR_SCENE',
    action_info: {
      scene: {
        scene_id: scene_id
      }
    }
  }, callback)
}
Client.prototype.createPermQRCode = function(scene_id, callback) {
  return this.createQRCode({
    action_name: 'QR_LIMIT_SCENE',
    action_info: {
      scene: {
        scene_id: scene_id
      }
    }
  }, callback)
}

/**
 * Upload a media file
 *
 *  @param {String} type  - the type of your media (image/voice/video/thumb)
 *  @param {String} filepath - where to read this file
 */
Client.prototype.uploadMedia = function(type, filepath, callback) {
  var req = this._superagent('POST', Client.MEDIA_ROOT + '/post')
  req.query({
    access_token: this.token,
    type: type
  })
  req.attach('media', filepath)
  if (callback) {
    req.end(callback)
  }
  return req
}

/**
 * Create a stream to download media
 */
Client.prototype.getMedia = function(media_id, callback) {
  var req = this._superagent('GET', this.mediaUrl(media_id))
  return req
}

/**
 * Get a url to download media
 */
Client.prototype.mediaUrl = function(media_id) {
  return Client.MEDIA_ROOT + '/get?' + qs.stringify({
    access_token: this.token,
    media_id: media_id
  })
}
