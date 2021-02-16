'use strict'

const { JsonTaskRepository } = require('./base-repository.js')
const { NedbTaskRepository } = require('./nedb-repository.js')

class TaskRepositoryFactory {
    static createRepository(type, options = {}) {
        let repository = null
        switch (type) {
            case "json":
                repository = new JsonTaskRepository(options)
                break
            case "nedb":
                repository = new NedbTaskRepository(options)
                break
            default:
                throw new Error(`don't support repository type: ${type}`)
        }
        return repository
    }
}



module.exports = {
    TaskRepositoryFactory: TaskRepositoryFactory
}
