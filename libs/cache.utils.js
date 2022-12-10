/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/12/09
 */
'use strict'
const fs = require('fs')
const {cache_file, cache_file_bak} = require('../config/config.js')
const {mkdir} = require('./utils.lib.js')
const {logger} = require('./logger.js')
let cache = new Map()

mkdir(cache_file, true)

if (fs.existsSync(cache_file)) {
  try {
    const rawText = fs.readFileSync(cache_file).toString(),
      arr = rawText.split('\n').filter(x => !!x).map(_ => _.trim())
    arr.forEach(x => cache.set(x, new Date()))
  } catch (e) {
    logger.warn(`Cache init failed: ${e.message}`)
  }
}

const get_cache = () => cache
const flush_cache = new_cache => {
  mkdir(cache_file, true)
  fs.renameSync(cache_file, cache_file_bak)
  let cacheKeys = [...cache.keys()].filter(x => !!x).map(_ => _.trim())
  fs.writeFileSync(cache_file, cacheKeys.join('\n'))
  cache = new_cache
}

module.exports = {
  get_cache,
  flush_cache,
}
