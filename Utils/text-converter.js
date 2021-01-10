'use strict'

const { Variable } = require('../Models/Task/variable-vo.js')

const TextConverter = class {
    #variables
    constructor() {
        this.#variables = []
    }
    addVariable(variable) {
        this.#variables.push(variable)
    }
    setVariables(variables) {
        this.#variables = variables
    }
    convert(text) {

        const convertText = this.#variables.toList().reduce((after, variable) => {
            const beforeReg = new RegExp("\\${" + variable.key + "}", 'g')

            let value = variable.value
            if (variable.type === Variable.TYPE_DYNAMIC) {
                value = Function(variable.value)()
            }
            return after.replace(beforeReg, value)
        }, text)

        return convertText
    }
}

module.exports = {
    TextConverter: TextConverter
}
