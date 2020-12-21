'use strict'

const { WebClient } = require('@slack/web-api')

const BotProviderFactory = class {
    static createBot = (type, options = {}) => {
        let bot = null
        switch (type) {
            case "slack":
                bot = new SlackBotProvider(options.slack.token, options.slack.channelId, options.slack.userName, options.slack.iconUrl)
                break
            case "debug":
                bot = new ConsoleBotProvider(options.debug.userName)
            default:
                bot = new ConsoleBotProvider(options.debug.userName)
                break
        }
        return bot
    }
}

const BaseBotProvider = class {
    post = async (text) => { }
}

const ConsoleBotProvider = class extends BaseBotProvider {
    #userName
    constructor(userName = "bot"){
        super()
        this.#userName = userName
    }
    post = async (text) => {
        const res = console.log(this.#userName, ": ", text)
        return res
    }
}

const SlackBotProvider = class extends BaseBotProvider {
    #channelId
    #userName
    #iconUrl
    #web
    constructor(token, channelId, userName, iconUrl) {
        super()
        if(!token || !channelId){
            throw "input error: slack bot"
        }
        this.#channelId = channelId
        this.#userName = userName
        this.#iconUrl = iconUrl
        this.#web = new WebClient(token)
    }
    post = async (text) => {
        try {
            const res = await this.#web.chat.postMessage({
                channel: this.#channelId,
                text: text,
                username: this.#userName,
                icon_url: this.#iconUrl
            })
            return res
        } catch (error) {
            console.log("run error: ", error)
        }
    }
}

module.exports = {
    BotProviderFactory : BotProviderFactory,
    ConsoleBotProvider : ConsoleBotProvider,
    SlackBotProvider : SlackBotProvider
}
