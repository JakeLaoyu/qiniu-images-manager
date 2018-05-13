/**
 * @Author: Jake
 * @Date:   2017-11-13T09:36:08+08:00
 * @Email:  yucj@dxy.cn
 * @Last modified by:   Jake
 * @Last modified time: 2017-11-15T15:12:05+08:00
 */
const qiniu = require('qiniu')

exports.uploadToken = (req, bucket) => {
  var mac = new qiniu.auth.digest.Mac(req.session.accessKey, req.session.secretKey)
  var options = {
    scope: bucket,
    callbackBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
    callbackBodyType: 'application/json'
  }
  var putPolicy = new qiniu.rs.PutPolicy(options)
  var uploadToken = putPolicy.uploadToken(mac)
  return uploadToken
}

/**
 * 图片列表
 * @param  {String} bucket 仓库名称
 * @param  {String} prefix 前缀
 * @return {[type]}        [description]
 */
exports.getImages = (req, bucket, prefix, cb) => {
  // @param options 列举操作的可选参数
  //                prefix    列举的文件前缀
  //                marker    上一次列举返回的位置标记，作为本次列举的起点信息
  //                limit     每次返回的最大列举文件数量
  //                delimiter 指定目录分隔符
  var options = {
    // limit: 10,
    prefix: prefix
  }
  getBucketManager(req).listPrefix(bucket, options, function (err, respBody, respInfo) {
    if (err) {
      console.log(err)
      throw err
    }

    // var nextMarker = respBody.marker
    // var commonPrefixes = respBody.commonPrefixes
    var items = respBody.items
    var prefixTraverseResult = {}
    if (items && items.length > 0) {
      prefixTraverseResult = prefixTraverse(items, prefix)
    }

    cb(respInfo.statusCode, respBody, prefixTraverseResult.images, prefixTraverseResult.prefixs)
  })
}

/**
 * 遍历前缀
 * @param  {Array} images 七牛返回的图片数组
 * @return {[type]}        前缀数组
 */
function prefixTraverse (images, prefix) {
  var prefixs = []
  var imagesUrl = []

  images.forEach(item => {
    if (prefix) {
      item.key = item.key.replace(prefix, '')
    }

    var specialPrefix = false
    var itemArr = item.key.split('/')
    if (itemArr.length > 1) {
      if (!specialPrefix && prefixs.indexOf(itemArr[ 0 ]) < 0) {
        prefixs.push(itemArr[ 0 ])
      } else if (specialPrefix && prefixs.indexOf('/' + itemArr[ 0 ]) < 0) {
        prefixs.push('/' + itemArr[ 0 ])
      }
    } else {
      imagesUrl.push(item)
    }
  })

  var data = {
    prefixs: prefixs,
    images: imagesUrl
  }

  return data
}

function getBucketManager (req) {
  var mac = new qiniu.auth.digest.Mac(req.session.accessKey, req.session.secretKey)
  var config = new qiniu.conf.Config()
  // config.useHttpsDomain = true;
  config.zone = qiniu.zone.Zone_z0
  return new qiniu.rs.BucketManager(mac, config)
}

exports.getBucketManager = getBucketManager