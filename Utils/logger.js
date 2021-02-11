'use strict'
const winston = require('winston')
require('winston-daily-rotate-file')
const config = require('./config-loader.js')
const util = require('util')
const format = winston.format

const Logger = class {
    #logger

    constructor( options = {level:'info', dir:'Logs'} ) {
      this.#logger = winston.createLogger({
        level: options.level,
        format: format.combine(
            format.timestamp({ format: this.timezoned }),
            format.splat(),
            format.json()
        ),
        //defaultMeta: { service: 'scheduler-multi-bot' },
        transports: [
            new winston.transports.DailyRotateFile({
                filename: 'application-%DATE%.log',
                dirname: options.dir,
                datePattern: 'YYYYMMDD',
                zippedArchive: false,
                maxSize: '10m',
                maxFiles: '7d',
                json: true
              }),
            new winston.transports.Console()
        ],
      })
    }

    timezoned() {
        return new Date().toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo'
        })
    }

    getLogger() {
        return this.#logger
    }

    async query(options) {
        const promiseQuery = util.promisify(this.#logger.query).bind(this.#logger)
        try {
            const result = await promiseQuery(options)
            return result.dailyRotateFile
        }
        catch(e) {
            console.log(e)
            throw e
        }
    }

    error( message ) {
        this.#logger.error(message)
    }

    warn( message ) {
        this.#logger.warn(message)
    }

    info( message ) {
        this.#logger.info(message)
    }

    http( message ) {
        this.#logger.http(message)
    }

    verbose( message ) {
        this.#logger.verbose(message)
    }

    debug( message ) {
        this.#logger.debug(message)
    }

    silly( message ) {
        this.#logger.silly(message)
    }
}

const logger = new Logger(config.logger.options)
Object.freeze(logger)

module.exports = logger
