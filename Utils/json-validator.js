const Ajv = require('ajv')
const { logger } = require('./logger.js')
const TaskSchema = require('./validation-json-schema-task.json')

class JsonValidator {
    static taskSchema = TaskSchema
    #ajv
    #validate
    constructor(schema){
        this.#ajv = new Ajv({ allErrors: true })
        this.#validate = this.#ajv.compile(schema)
    }
    valid(data){
        const valid = this.#validate(data)
        if (!valid) {
            logger.error(this.#validate.errors)
            return false
        }
        return true
    }
    getErrors(){
        return this.#validate.errors
    }
}

module.exports = {
    JsonValidator: JsonValidator
}