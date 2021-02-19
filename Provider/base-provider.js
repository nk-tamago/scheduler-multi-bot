'use strict'

const { logger } = require('../Utils/logger.js')

class BaseBotProvider {
    async simpleTextPost(text) {
        logger.debug(`test: ${text}`)
        return true
    }
    async customPost(custom) {
        logger.debug(`custom: ${JSON.stringify(custom)}`)
        return true
    }
}

class ConsoleBotProvider  extends BaseBotProvider {
    #userName
    constructor(userName = "bot") {
        super()
        this.#userName = userName
    }
    async simpleTextPost(text) {
        logger.info(`${this.#userName}: ${text}`)
        return true
    }
    async customPost(custom) {
        logger.info(`${this.#userName}: ${JSON.stringify(custom)}`)
        return true
    }
}


module.exports = {
    BaseBotProvider: BaseBotProvider,
    ConsoleBotProvider: ConsoleBotProvider
}
