var Client = require('./lib/client')

module.exports = function(key, secret, token) {
  return new Client(key, secret, token)
}
module.exports.Client = Client

