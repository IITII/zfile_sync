/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/12/08
 */
'use strict'

const fs = require('fs'),
  path = require('path')

const {logger} = require('./libs/logger.js')
const {list_drive, list_dir} = require('./libs/api.utils.js')
const {origin, sync} = require('./config/config.js')
const {sleep, titleFormat, isPhoto, toAbsUrl, spendTime, time_human} = require('./libs/utils.lib.js')
const {downloadFiles} = require('./libs/dl.utils.js')
const {get_cache, flush_cache} = require('./libs/cache.utils.js'),
  cache = get_cache()
let start = Date.now()

async function main() {
  let drives = await list_drive()
  drives = sync.drive_id !== -1 ? drives.filter(_ => _.id === sync.drive_id) : drives
  for (const drive of drives) {
    let local = path.resolve(sync.local, drive.local)
    logger.info(`sync drive: ${drive.name}(${drive.id}) to ${local}`)
    await spendTime(`sync drive ${drive.name}(${drive.id})`, sync_drive, drive.id, sync.target, local)
  }
}

async function sync_drive(driveId, target, local) {
  let queue = [{target, local}], round = 1, tmp = []
  while (queue.length > 0) {
    let dirs = [], folders = [], files = [], unknown = []
    const shift = queue.shift()
    if (shift) {
      const {target, local} = shift
      logger.info(`sync drive ${driveId}: ${target} -> ${local}`)

      if (round === sync.target_round) {
        if (cache.has(target)) {
          logger.info(`skip: ${target} at round ${round}`)
          continue
        } else {
          cache.set(target, new Date())
        }
      }
      dirs = await list_dir(driveId, target)
      folders = dirs.filter(_ => _.type === 'folder').map(_ => ({
        target: _.abs,
        local: path.resolve(local, titleFormat(_.name))
      }))
      files = dirs.filter(_ => _.type === 'file')
      unknown = dirs.filter(_ => _.type !== 'folder' && _.type !== 'file')
      await handle_files(files, local)

      if (unknown.length > 0) {
        logger.warn(`unknown type: ${JSON.stringify(unknown)}`)
      }

      logger.info(`sleep ${sync.slow_time}ms for slow down`)
      await sleep(sync.slow_time)
    }
    logger.info(`round: ${round}: remain ${queue.length + tmp.length} tasks, total: ${time_human(Date.now() - start)}`)

    tmp = tmp.concat(folders)
    if (queue.length === 0) {
      queue = tmp
      tmp = []
      round += 1
    }
  }
}

async function handle_files(files, local) {
  if (!(files && files.length > 0)) return Promise.resolve()
  let dls = []
  if (sync.mode === 'img') {
    dls = files.filter(_ => isPhoto(_.name))
    files.filter(_ => !isPhoto(_.name)).forEach(_ => logger.warn(`skip file: ${_.name}`))
  } else {
    dls = files
  }
  dls = dls.map(_ => ({..._, url: toAbsUrl(_.url, origin), local: path.resolve(local, _.name)}))
  await downloadFiles(dls, local)
}

function stop() {
  logger.info(`flush cache before stop, running time: ${time_human(Date.now() - start)}`)
  flush_cache(cache)
  process.exit(0)
}

process.on('SIGINT' || 'SIGTERM', stop)

spendTime(`Sync at ${new Date()}`, main)
  .catch(logger.error)
  .finally(stop)

