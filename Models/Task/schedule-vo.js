'use strict'

const Schedules = class {
    #schedules
    constructor() {
        this.#schedules = []
    }
    add(schedule) {
        this.#schedules.push(schedule)
    }
    toList() {
        return this.#schedules
    }
    toJson() {
        const json = []

        for (let schedule of this.#schedules) {
            json.push(schedule.toJson())
        }

        return json
    }
}

const Schedule = class {
    static MODE_SEQUENCE = "sequence"
    static MDDE_RANDOM = "random"
    #mode
    #cron
    #texts
    constructor(mode, cron, texts) {
        if (!mode || !cron || !texts) {
            throw new Error("schedule [mode or cron or texts] is not exists")
        }
        if (mode !== Schedule.MODE_SEQUENCE && mode !== Schedule.MDDE_RANDOM) {
            throw new Error(`don't support schedule mode: ${mode}`)
        }


        this.#mode = mode
        this.#cron = cron
        this.#texts = texts
    }
    get mode() {
        return this.#mode
    }
    get cron() {
        return this.#cron
    }
    get texts() {
        return this.#texts
    }
    toJson() {
        return {
            mode: this.#mode,
            cron: this.#cron,
            texts: this.#texts
        }
    }
}

module.exports = {
    Schedule: Schedule,
    Schedules: Schedules
}
