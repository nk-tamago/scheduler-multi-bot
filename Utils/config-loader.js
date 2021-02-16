'use strict'

const fs = require('fs')

class ConfigLoader {
    #config
    constructor() {
      this.#config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))

      if (!this.#config.repository || !this.#config.repository.type || !this.#config.repository.options) {
        throw new Error("config error: repository not exists")
      }
      if (!this.#config.logger || !this.#config.logger.options || !this.#config.logger.options.level || !this.#config.logger.options.dir) {
        throw new Error("config error: config not exists")
      }
    }

    getConfig() {
        return this.#config
    }
}

const config = new ConfigLoader()
Object.freeze(config)

module.exports = config.getConfig()

