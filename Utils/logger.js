'use strict'
const winston = require('winston')
require('winston-daily-rotate-file')
const config = require('./config-loader.js')
const util = require('util')
const format = winston.format

class Logger {
    #logger

    static levels = [ 
        "error",
        "warn",
        "info",
        "http",
        "verbose",
        "debug",
        "silly"
    ]

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

    error( message, ...args ) {
        this.#logger.error(message, args)
    }

    warn( message, ...args ) {
        this.#logger.warn(message, args)
    }

    info( message, ...args ) {
        this.#logger.info(message, args)
    }

    http( message, ...args ) {
        this.#logger.http(message, args)
    }

    verbose( message, ...args ) {
        this.#logger.verbose(message, args)
    }

    debug( message, ...args ) {
        this.#logger.debug(message, args)
    }

    silly( message, ...args ) {
        this.#logger.silly(message, args)
    }
}

const logger = new Logger(config.logger.options)
Object.freeze(logger)

module.exports = {
    Logger: Logger,
    logger: logger
}