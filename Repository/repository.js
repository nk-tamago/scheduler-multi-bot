
const fs = require('fs')

const RepositoryFactory = class {
    static createRepository = (type, options = {}) => {
        let repository = null
        switch (type) {
            case "json":
                repository = new JsonRepository(options)
                break
            default:
                repository = new JsonRepository(options)
                break
        }
        return repository
    }
}

const BaseRepository = class {
    load = async () => {}
    getStaticVariables = async () =>{}
    getDynamicVariables = async () =>{}
    getTasks = async () => {}
}

const JsonRepository = class extends BaseRepository {
    #path
    #settingJson
    constructor( options ) {
        super()
        this.#path = options.path
    }
    load = async () => {
        this.#settingJson = JSON.parse(fs.readFileSync(this.#path, 'utf8'))
    }
    getStaticVariables = async () =>{
        const variables = new Array()
        for (let key in this.#settingJson.variables.staticVariableMap) {
            variables.push( {key: key, value: this.#settingJson.variables.staticVariableMap[key]})
        }

        return variables
    }
    getDynamicVariables = async () =>{
        const variables = new Array()
        for (let key in this.#settingJson.variables.dynamicVariableMap) {
            variables.push( {key: key, value: this.#settingJson.variables.dynamicVariableMap[key]})
        }

        return variables
    }
    getTasks = async () => {
        return this.#settingJson.tasks
    }
}


module.exports = {
    RepositoryFactory : RepositoryFactory,
    JsonRepository : JsonRepository
}
