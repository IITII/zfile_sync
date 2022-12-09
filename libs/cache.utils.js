/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/12/09
 */
'use strict'
const fs = require('fs')
const {cache_file} = require('../config/config.js')
const {mkdir} = require('./utils.lib.js')
const {logger} = require('./logger.js')
let cache = new Map()

mkdir(cache_file, true)

if (fs.existsSync(cache_file)) {
  try {
    const rawText = fs.readFileSync(cache_file).toString(),
      rawJson = JSON.parse(rawText)
    cache = new Map(Object.entries(rawJson))
  } catch (e) {
    logger.warn(`Cache init failed: ${e.message}`)
  }
}

const get_cache = () => cache
const flush_cache = new_cache => {
  mkdir(cache_file, true)
  fs.writeFileSync(cache_file, JSON.stringify(Object.fromEntries(new_cache)))
  cache = new_cache
}

module.exports = {
  get_cache,
  flush_cache,
}
