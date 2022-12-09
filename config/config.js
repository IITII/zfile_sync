/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const fs = require('fs'),
  https = require('https'),
  path = require('path')
const opts = {
  origin: process.env.SYNC_ORIGIN || '',
  sync: {
    drive_id: -1,
    // zfile 目标路径
    target: process.env.SYNC_TARGET || '/',
    // 本地路径
    local: process.env.SYNC_LOCAL || '../tmp',
    // 同步模式, mix: 全部, img: 图片和文件夹
    mode: 'mix',
    // slow 模式, api 请求间隔, 单位: ms
    slow_time: process.env.SLOW_TIME || 500,
    target_round: 3,
  },
  download: {
    // 下载并发数
    zfileLimit: process.env.ZFILE_LIMIT || 3,
    // 下载后等待 ms
    zfileSleep: process.env.ZFILE_SLEEP || 500,
  },
  cache_file: process.env.SYNC_CACHE || '../cache.txt',
}
opts.api = {
  cf: true,
  base: opts.origin,
  config: '/zfile.config.json',
  drive_list: '/api/drive/list',
  dir_list: {
    url: '/api/list/${drive_id}',
    params: {
      path: '/',
      password: '',
      orderBy: 'name',
      orderDirection: 'asc',
    },
  },
  opts: {
    responseType: 'json',
  },
}
const config = {
  DEBUG: process.env.SYNC_DEBUG === 'true',
  PROXY: process.env.PROXY,
  axios: {
    // baseURL: 'https://api.telegram.org/bot',
    // proxy: process.env.PROXY,
    proxy: undefined,
    // 时间设置不合理可能会导致订阅超时失败
    timeout: 1000 * 20,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36',
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  },
  ...opts,
}

// DO NOT TOUCH UNLESS YOU KNOW WHAT YOU ARE DOING
if (!config.origin) {
  throw new Error('SYNC_ORIGIN is required')
}
config.sync.local = path.resolve(__dirname, config.sync.local)
config.cache_file = path.resolve(__dirname, config.cache_file)
config.sync.slow_time = parseInt(config.sync.slow_time)
config.download.zfileLimit = parseInt(config.download.zfileLimit)
config.download.zfileSleep = parseInt(config.download.zfileSleep)
const headers = {
  Referer: config.origin,
  Host: new URL(config.origin).host,
  Connection: 'keep-alive',
}
config.api.opts.headers = {
  ...config.axios.headers,
  ...headers,
  ...config.api.opts.headers,
}
const proxy = process.env.PROXY?.replace(/https?:\/\//, '')
if (proxy) {
  config.axios.proxy = {
    host: proxy.split(':')[0],
    port: proxy.split(':')[1],
  }
}
// mkdir(config.clip.baseDir)
// if (!config.db.database) {
//   config.db.database = '../db/db.json'
// }
// config.db.database = path.resolve(__dirname, config.db.database)
// mkdir(path.dirname(config.db.database))
//
// function mkdir(dir) {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, {recursive: true})
//     console.log(`mkdir ${dir}`)
//   }
// }

module.exports = config
