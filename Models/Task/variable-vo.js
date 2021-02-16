'use strict'

class Variables {
    #variables
    constructor() {
        this.#variables = []
    }
    toList() {
        return this.#variables
    }
    add(variable) {
        this.#variables.push(variable)
    }
    toJson() {
        const json = []

        for (let variable of this.#variables) {
            json.push(variable.toJson())
        }

        return json
    }
}

class Variable {
    static TYPE_STATIC = "static"
    static TYPE_DYNAMIC = "dynamic"
    #type
    #key
    #value
    constructor(type, key, value) {
        if (!type || !key || !value) {
            throw new Error("variable [type or key or value] is not exists")
        }

        if (type !== Variable.TYPE_STATIC && type !== Variable.TYPE_DYNAMIC) {
            throw new Error(`don't support variable type: ${type}`)
        }

        this.#type = type
        this.#key = key
        this.#value = value
    }
    get type() {
        return this.#type
    }
    get key() {
        return this.#key
    }
    get value() {
        return this.#value
    }
    toJson() {
        return {
            type: this.#type,
            key: this.#key,
            value: this.#value
        }
    }
}

module.exports = {
    Variable: Variable,
    Variables: Variables
}
