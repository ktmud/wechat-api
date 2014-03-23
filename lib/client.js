var INVALID_TOKEN = 40001
var debug = require('debug')('wechat:api:debug')


function Client(appid, secret, token) {
  this.appid = appid
  this.secret = secret
  this.token = token
  this.init()
}


Client.prototype.init = function() {
  aliasProperty(this, 'access_token', 'token')
  aliasProperty(this, 'key', 'appid')
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
      return callback.call(self, err, result, req, res)
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

/**
 * Get a new access_token
 */
Client.prototype.refreshToken = function(callback) {
  var self = this
  var req = self._superagent('/token')

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
      self.token = result.access_token
      self.expire_date = new Date(+new Date() + 7000 * 1000)
      debug('Got new token: %j', result)
    } else {
      debug('Error when getting access_token: %j', result)
    }
    if (result && result.errcode) {
      err = result
    }
    if (err) {
      self.last_error = err
    }
    callback && callback(err)
  })
  return req
}

module.exports = Client

require('./interface')


Client.MEDIA_ROOT = 'http://file.api.weixin.qq.com/cgi-bin/media'
Client.API_ROOT = 'https://api.weixin.qq.com/cgi-bin'

Client.setApiRoot = function(root) {
  root = root || Client.API_ROOT
  Client.API_ROOT = root
  Client.prototype._superagent = prefixedRequest(root)
}
Client.setApiRoot()


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
