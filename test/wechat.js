var should = require('should')

var KEY = 'wx7440bf7ff5f23a1a'
var SECRET = '972ba827a38121094268724ce0360f67'
var GH_ID = 'gh_b1a083fb1739'

describe('Wechat API', function() {
  var client = require('..')(KEY, SECRET)

  describe('#refreshToken()', function() {
    it('should emit refresh event', function(done) {
      client.refreshToken()
      client.once('refresh', function(token) {
        should.exist(token.access_token)
        done()
      })
    })
    it('should reuse token', function(done) {
      var token = client.token
      should.exist(token)
      should.equal(token, client.access_token)
      client.deleteMenu(function(err) {
        should.equal(client.token, token)
        should.not.exist(err)
        done()
      })
    })
    it('can re-refresh token', function(done) {
      var old = client.access_token
      client.refreshToken(function(err, token) {
        should.not.exist(err)
        should.exist(client.token)
        should.notEqual(old, client.token)
        done()
      })
    })
  })

  describe('#menu', function() {
    var menu = {
      button: [{
        type: 'click',
        name: '测试1',
        sub_button: [],
        key: 'test1'
      }, {
        name: '有子菜单',
        sub_button: [
          {
            type: 'view',
            name: '访问网址',
            sub_button: [],
            url: 'http://github.com/node-webot/wechat-api'
          }, {
            type: 'click',
            name: '测试2',
            sub_button: [],
            key: 'test2'
          }
        ]
      }]
    }
    it('can createMenu', function(done) {
      client.createMenu(menu, function(err, result) {
        should.not.exist(err)
        done()
      })
    })
    it('can getMenu', function(done) {
      client.getMenu(function(err, result) {
        should.not.exist(err)
        menu.should.eql(result.menu)
        done()
      })
    })
    it('can deleteMenu', function(done) {
      client.deleteMenu(function(err) {
        should.not.exist(err)
        client.getMenu(function(err, result) {
          should.exist(err)
          err.errcode.should.eql(46003)
          done()
        })
      })
    })
  })

  describe('only token', function() {
    it('should be ok with only token', function(done) {
      var client2 = require('..')(null, null, client.access_token)
      client.getUserList(function(err, result) {
        should.not.exist(err)
        result.data.openid.should.be.an.instanceof(Array)
        done()
      })
    })
  })

})
