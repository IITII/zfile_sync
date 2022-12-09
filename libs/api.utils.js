/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/12/09
 */
'use strict'

const {axios} = require('./axios_client.js')
const cloudscraper = require('cloudscraper')
const {api} = require('../config/config.js')
const {logger} = require('./logger.js')
const path = require('path')
const {titleFormat} = require('./utils.lib.js')

async function api_get(url, params = {}) {
  let res, full_url
  full_url = new URL(url, api.base).toString()
  if (api.cf) {
    res = cloudscraper({
      uri: full_url,
      formData: params,
    }).then(_ => JSON.parse(_))
  } else {
    res = axios.get(full_url, {...api.opts, params})
      .then(res => res.data)
  }
  return await res
}

async function list_drive(params = {}) {
  return api_get(api.drive_list, params)
    .then(_ => {
      if (_.code === 0) {
        return _.data
      }
      throw new Error(`code: ${_.code}, msg: ${_.msg}`)
    })
    .then(_ => _.driveList)
    .then(r => r.map(_ => ({id: _.id, name: _.name && _.name !== 'none' ? _.name : _.type.description})))
    .then(r => r.map(_ => ({id: _.id, name: _.name, local: titleFormat(`${_.name}_${_.id}`)})))
}

async function list_dir(driveId, dir = '/') {
  let url, params
  url = api.dir_list.url.replace('${drive_id}', driveId)
  params = {...api.dir_list.params, path: dir}
  return api_get(url, params)
    .then(_ => {
      if (_.code === 0) {
        return _.data
      }
      throw new Error(`code: ${_.code}, msg: ${_.msg}`)
    })
    .then(_ => _.files)
    .then(r => r.map(_ => ({..._, type: _.type.toLowerCase(), abs: path.resolve(_.path, _.name)})))
}

module.exports = {
  api_get,
  list_drive,
  list_dir,
}
