# wechat-api 微信公共平台 API 工具

本模块只负责与 `access_token` 有关的高级接口功能，
接收和发送消息请使用 [wechat-mp](https://www.npmjs.org/package/wechat-mp) 。

## 特点

- 统一的 API 调用
- 自动管理 `access_token` 过期时间，请求时如遇过期，将自动刷新。


## 使用

```javascript
// replace `APP_ID` and `SECRET` with corresponding value
var wechat = require('wechat-api')(APP_ID, SECRET)

// 查询自定义菜单信息
wechat.getMenu(function(err, result) {

  // the `result` will be the json response

  // when error happens:
  //
  // err == {"errcode":40013,"errmsg":"invalid appid"}
  // result == null
  //
})

// 根据 OpenID 获取用户信息
wechat.getUserInfo({
  openid: 'o6_bmjrPTlm6_2sgVt7hMZOPfL2M',
  lang: 'zh_CN'
}, function(err, result) {
})
```

### 全部 API


```
- createMenu(menu, callback)    [创建菜单](http://mp.weixin.qq.com/wiki/index.php?title=%E8%87%AA%E5%AE%9A%E4%B9%89%E8%8F%9C%E5%8D%95%E5%88%9B%E5%BB%BA%E6%8E%A5%E5%8F%A3)
- getMenu(callback)             [查询自定义菜单](http://mp.weixin.qq.com/wiki/index.php?title=%E8%87%AA%E5%AE%9A%E4%B9%89%E8%8F%9C%E5%8D%95%E6%9F%A5%E8%AF%A2%E6%8E%A5%E5%8F%A3)
- deleteMenu(callback)          [删除自定义菜单](http://mp.weixin.qq.com/wiki/index.php?title=%E8%87%AA%E5%AE%9A%E4%B9%89%E8%8F%9C%E5%8D%95%E5%88%A0%E9%99%A4%E6%8E%A5%E5%8F%A3)

- getUserInfo(args, callback)   [获取用户信息](http://mp.weixin.qq.com/wiki/index.php?title=%E8%8E%B7%E5%8F%96%E7%94%A8%E6%88%B7%E5%9F%BA%E6%9C%AC%E4%BF%A1%E6%81%AF)
- getUserList(args, callback)   [获取关注者列表](http://mp.weixin.qq.com/wiki/index.php?title=%E8%8E%B7%E5%8F%96%E5%85%B3%E6%B3%A8%E8%80%85%E5%88%97%E8%A1%A8)

- createQRCode(args, callback)                            [创建二维码](http://mp.weixin.qq.com/wiki/index.php?title=%E7%94%9F%E6%88%90%E5%B8%A6%E5%8F%82%E6%95%B0%E7%9A%84%E4%BA%8C%E7%BB%B4%E7%A0%81)
- createTempQRCode(scene_id, [expires_seconds,] callback) 创建临时二维码
- createPermQRCode(scene_id, callback)                     创建永久二维码

- uploadMedia(type, filepath, callback)  [上传多媒体文件](http://mp.weixin.qq.com/wiki/index.php?title=%E4%B8%8A%E4%BC%A0%E4%B8%8B%E8%BD%BD%E5%A4%9A%E5%AA%92%E4%BD%93%E6%96%87%E4%BB%B6)
- mediaUrl(media_id)                     获取文件下载地址
- getMedia(media_id)                     下载多媒体文件，返回一个 readable stream ，可直接 pipe 到本地文件存储
```


## TODO

- 接口频率限制
