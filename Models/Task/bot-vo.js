'use strict'

const { BotProviderFactory } = require('../../Provider/bot-factory.js')

class Bot {
    #type
    #options
    #provider
    constructor( type, options = {} ){
        if( !type ){
            throw new Error("bot type is not exists")
        }

        this.#type = type
        this.#options = options
        this.#provider = BotProviderFactory.createBot(type, options)

    }
    get type(){
        return this.#type
    }
    get options(){
        return this.#options
    }
    get provider(){
        return this.#provider
    }

    toJson(){
        return {
            type : this.#type,
            options : this.#options,
        }
    }

}

module.exports = {
    Bot : Bot
}
