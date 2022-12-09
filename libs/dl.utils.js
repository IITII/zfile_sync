/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/12/09
 */
'use strict'

const fs = require('fs')
const {origin, download} = require('../config/config.js')
const {logger} = require('./logger.js')
const {axios} = require('./axios_client.js')
const {sleep, spendTime, currMapLimit, mkdir} = require('./utils.lib.js')

async function downloadFile(url, filePath, referer = origin) {
  return await new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).size === 0) {
        logger.warn(`File ${filePath} exists but empty, removed.`)
        fs.unlinkSync(filePath)
      } else {
        logger.warn(`File ${filePath} already exists`)
        return resolve(filePath)
      }
    } else {
      mkdir(filePath, true)
    }
    logger.debug(`Downloading ${url}...`)
    const opts = {
      responseType: 'arraybuffer',
      headers: axios.defaults.headers,
    }
    if (referer) {
      opts.headers['referer'] = referer
    }
    axios.get(url, opts)
      .then(res => {
        fs.writeFileSync(filePath, Buffer.from(res.data, 'binary'))
      })
      .then(() => logger.debug(`Downloaded ${url} to ${filePath}`))
      // 需要 resolve, 否则会出现消费卡住的情况
      .then(resolve)
      .catch(e => {
        logger.error(`Download error ${e.status}: ${e.message}`, e)
        return reject(e)
      })
  })
}

async function downloadFiles(files, local) {
  let download_failed = []

  async function handle(file) {
    try {
      let res
      res = await downloadFile(file.url, file.local)
      if (download.zfileSleep > 0) {
        await sleep(download.zfileSleep)
      }
      return Promise.resolve(res)
    } catch (e) {
      download_failed.push([file.url, e.message])
      return Promise.resolve()
    }
  }

  return spendTime(`downloaded ${files.length} files to ${local}`, currMapLimit, files, download.zfileLimit, handle)
    // .then(e => {
    //   logger.info(e)
    // })
    // .catch(e => {
    //   logger.error(e)
    // })
    .finally(() => {
      if (download_failed.length > 0) {
        logger.error(`Download failed: ${download_failed.length} files`, download_failed)
      }
    })
}

module.exports = {
  downloadFiles,
}
