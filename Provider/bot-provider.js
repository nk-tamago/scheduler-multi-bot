'use strict'

const { WebClient } = require('@slack/web-api')
const { logger } = require('../Utils/logger.js')

class BotProviderFactory {
    static createBot(type, options = {}) {
        let bot = null
        switch (type) {
            case "slack":
                // todo 入力チェック
                if (!options.slack || !options.slack.token || !options.slack.channelId) {
                    throw new Error("options.slack or slack[token or channelId] is not exists")
                }
                bot = new SlackBotProvider(options.slack.token, options.slack.channelId, options.slack.userName, options.slack.iconUrl)
                break
            case "debug":
                if (!options.debug) {
                    throw new Error("options.debug is not exists")
                }
                bot = new ConsoleBotProvider(options.debug.userName)
                break
            default:
                throw new Error(`don't support bot type: ${type}`)
        }
        return bot
    }
}

class BaseBotProvider {
    async post(text) { }
}

class ConsoleBotProvider  extends BaseBotProvider {
    #userName
    constructor(userName = "bot") {
        super()
        this.#userName = userName
    }
    async post(text) {
        const res = logger.info(`${this.#userName}: ${text}`)
        return res
    }
}

class SlackBotProvider  extends BaseBotProvider {
    #channelId
    #userName
    #iconUrl
    #web
    constructor(token, channelId, userName, iconUrl) {
        super()
        if (!token || !channelId) {
            throw new Error("input error: slack bot")
        }
        this.#channelId = channelId
        this.#userName = userName
        this.#iconUrl = iconUrl
        this.#web = new WebClient(token)
    }
    async post(text) {
        try {
            const res = await this.#web.chat.postMessage({
                channel: this.#channelId,
                text: text,
                username: this.#userName,
                icon_url: this.#iconUrl
            })
            return res
        } catch (error) {
            logger.error(`run error: ${error.stack}`)
        }
    }
}

module.exports = {
    BotProviderFactory: BotProviderFactory,
    ConsoleBotProvider: ConsoleBotProvider,
    SlackBotProvider: SlackBotProvider
}
