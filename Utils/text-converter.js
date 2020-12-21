'use strict'

const TextConverter = class {
    #variables
    constructor() {
        this.#variables = new Array()
    }
    addVariable(key, value) {
        this.#variables.push({ key: key, value: value })
    }
    convert(text) {
        const convertText = this.#variables.reduce((after, variable) => {
            const before = new RegExp("\\${" + variable.key + "}", 'g')
            return after.replace(before, variable.value)

        }, text)

        return convertText
    }
}

module.exports = {
    TextConverter : TextConverter
}
