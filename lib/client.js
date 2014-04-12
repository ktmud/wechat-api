var INVALID_TOKEN = 40001
var debug = require('debug')('wechat:api:debug')
var util = require('util')

module.exports = Client


function Client(appid, secret, access_token) {
  if (!(this instanceof Client)) {
    return new Client(appid, secret, access_token)
  }
  this.appid = appid
  this.secret = secret
  this.token = access_token
  this._refreshing = null
  this.init()
}
util.inherits(Client, require('events').EventEmitter)

// export the code
// so it is possible to:
//
// wx.refreshToken(function(err) {
//  if (err === wx.INVALID_TOKEN) {
//    // do stuff
//  }
// })
Client.INVALID_TOKEN = Client.prototype.INVALID_TOKEN = INVALID_TOKEN

Client.prototype.init = function() {
  aliasProperty(this, 'access_token', 'token')
  aliasProperty(this, 'key', 'appid')
  if (!this.token) {
    debug('No token provided for init, try get one...')
    this.refreshToken()
    this.once('refresh', function() {
      this.emit('ready')
    })
  } else {
    this.emit('ready')
  }
}

Client.prototype._request = function(method, url, data, callback, refresh_tries) {
  var self = this

  if ('function' === typeof data) {
    refresh_tries = callback
    callback = data
    data = null
  }
  if (refresh_tries === undefined) {
    refresh_tries = 3
  }
  if (!callback) {
    callback = function(err, res) {
      if (err) {
        debug('Wechat API error: %s, %j', err, res)
      }
    }
  }

  function refresh(done) {
    debug('Token invalid, refreshing..')
    self.refreshToken(function(err, token) {
      if (err) {
        return callback.call(self, err)
      }
      done()
    })
  }

  function run() {
    var req = self._superagent(method, url)

    req.query({
      access_token: self.token
    })

    if (data) {
      if (method == 'GET') {
        req.query(data)
      } else {
        req.send(data)
      }
    }

    debug('%s -> %s', method, req.url)

    req.end(function(err, res) {
      var result = res.body

      err = err || res.error || null

      if (err || !result) {
        return callback.call(self, err, result, req, res)
      }
      if (result && result.errcode == INVALID_TOKEN && refresh_tries) {
        refresh_tries -= 1
        return refresh(run)
      }
      if (result && result.errcode) {
        err = result
        result = null
      }
      if (err) {
        self.last_error = err
      }
      callback.call({ req: req, res: res }, err, result)
    })
  }

  if (!self.token || self.hasExpired()) {
    refresh(run)
  } else {
    run()
  }
}

Client.prototype.hasExpired = function() {
  return this.expire_date < new Date()
}

Client.prototype.loadToken = function(info) {
  if ('string' == typeof info) {
    info = {
      access_token: info
    }
  }
  var expire = info.expires_in || 7200

  this.token = info.access_token
  this.expire_date = info.expire_date || new Date(+new Date() + expire * 1000)
}

/**
 * Get a new access_token
 */
Client.prototype.refreshToken = function(callback) {
  var self = this
  var req = self._superagent('/token')

  if (callback) {
    self.on('refresh', function(token) {
      callback(null, token)
    })
    self.on('refresh_error', function(err) {
      callback(err)
    })
  }

  // to prevent multiple refresh request
  if (this._refreshing) {
    debug('Refreshing in progress, queue callback')
    return this._refreshing
  }

  debug('Refreshing token...')

  req.query({
    grant_type: 'client_credential',
    appid: self.appid,
    secret: self.secret,
  })
  req.end(function(err, res) {
    var result = res.body

    // empty `res.error` will be a `false`, we want it as `null
    err = err || res.error || null

    if (result && result.access_token) {
      debug('Got new token: %j', result)
      result.expire_date = new Date(+new Date() + result.expires_in * 1000)
      self.loadToken(result)
      self.emit('refresh', result)
    } else {
      debug('Error when getting access_token: %j', result)
    }
    if (result && result.errcode) {
      err = result
    }
    if (err) {
      self.emit('refresh_error', err)
      self.last_error = err
    }
    delete this._refreshing
  })

  this._refreshing = req

  return req
}

Client.MEDIA_ROOT = 'http://file.api.weixin.qq.com/cgi-bin/media'
Client.API_ROOT = 'https://api.weixin.qq.com/cgi-bin'

Client.setApiRoot = function(root) {
  root = root || Client.API_ROOT
  Client.API_ROOT = root
  Client.prototype._superagent = prefixedRequest(root)
}
Client.setApiRoot()



require('./interface')



function prefixedRequest(prefix) {
  var request = require('superagent')
  return function() {
    var req = request.apply(this, arguments)
    if (req.url[0] === '/') {
      req.url = prefix + req.url
    }
    return req
  }
}

function aliasProperty(obj, name, alias) {
  Object.defineProperty(obj, name, {
    get: function() {
      return this[alias]
    },
    set: function(value) {
      this[alias] = value
    }
  })
}
