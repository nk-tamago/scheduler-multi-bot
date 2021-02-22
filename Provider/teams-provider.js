'use strict'

const { BaseBotProvider } = require('./base-provider.js')
const { logger } = require('../Utils/logger.js')
const axios = require('axios')

class TeamsBotProvider  extends BaseBotProvider {
    #api
    constructor(webhook) {
        super()
        if (!webhook) {
            throw new Error("input error: teams bot")
        }
        this.#api = axios.create({
            baseURL: webhook,
            headers: {'Content-Type': 'application/json'}
        })
        
    }
    async simpleTextPost(text) {
        try {
            const body = {
                "text": text
            }
            const res = await this.#api.post('', body)
            return res
        } catch (error) {
            logger.error(`run error: ${error.stack}`)
        }
    }
    async customPost(custom) {
        try {
            const res = await this.#api.post('', custom)
            return res
        }
        catch (error) {
            logger.error(`run error: ${error.stack}`)
        }
    }
}

module.exports = {
    TeamsBotProvider: TeamsBotProvider
}
