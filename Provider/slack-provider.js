'use strict'

const { WebClient } = require('@slack/web-api')
const { BaseBotProvider } = require('./base-provider.js')
const { logger } = require('../Utils/logger.js')

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
    async simpleTextPost(text) {
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
    async customPost(custom) {
        try {
            const body= {
                ...{
                    channel: this.#channelId,
                    username: this.#userName,
                    icon_url: this.#iconUrl
                },
                ...custom
            }
            const res = await this.#web.chat.postMessage( body )
             res
        } catch (error) {
            logger.error(`run error: ${error.stack}`)
        }
    }
}

module.exports = {
    SlackBotProvider: SlackBotProvider
}
