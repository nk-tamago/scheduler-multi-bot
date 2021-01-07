'use strict'

const TextConverter = class {
    #staticVariables
    #dynamicVariables
    constructor() {
        this.#staticVariables = new Array()
        this.#dynamicVariables = new Array()
    }
    addStaticVariable(key, value) {
        this.#staticVariables.push({ key: key, value: value })
    }
    addDynamicVariable(key, value) {
        this.#dynamicVariables.push({ key: key, value: value })
    }
    convert(text) {
        const convertStaticText = this.#staticVariables.reduce((after, variable) => {
            const beforeReg = new RegExp("\\${" + variable.key + "}", 'g')
            return after.replace(beforeReg, variable.value)

        }, text)


        const convertDynamicText = this.#dynamicVariables.reduce((after, variable) => {
            const beforeReg = new RegExp("\\${" + variable.key + "}", 'g')

            const execValue = Function(variable.value)()
            return after.replace(beforeReg, execValue)

        }, convertStaticText)


        return convertDynamicText
    }
}

module.exports = {
    TextConverter : TextConverter
}
