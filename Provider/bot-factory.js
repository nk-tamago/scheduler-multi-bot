'use strict'

const { ConsoleBotProvider } = require('./base-provider.js')
const { SlackBotProvider } = require('./slack-provider.js')
const { TeamsBotProvider } = require('./teams-provider.js')
const { logger } = require('../Utils/logger.js')

class BotProviderFactory {
    static createBot(type, options = {}) {
        let bot = null
        switch (type) {
            case "slack":
                if (!options.slack || !options.slack.token || !options.slack.channelId) {
                    throw new Error("options.slack or slack[token or channelId] is not exists")
                }
                bot = new SlackBotProvider(options.slack.token, options.slack.channelId, options.slack.userName, options.slack.iconUrl)
                break
            case "teams":
                if (!options.teams || !options.teams.webhook ) {
                    throw new Error("options.teams or options.teams.webhook is not exists")
                }
                bot = new TeamsBotProvider(options.teams.webhook)
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

module.exports = {
    BotProviderFactory: BotProviderFactory
}
