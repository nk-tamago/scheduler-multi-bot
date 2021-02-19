'use strict'

class Schedules {
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

class Schedule {
    static MODE_SEQUENCE = "sequence"
    static MDDE_RANDOM = "random"
    #mode
    #cron
    #texts
    #overrideObjects
    constructor(mode, cron, texts, overrideObjects) {
        if (!mode || !cron ) {
            throw new Error("schedule [mode or cron] is not exists")
        }
        if ( !texts && !overrideObjects) {
            throw new Error("schedule [texts or overrideObjects] is not exists")
        }
        if (mode !== Schedule.MODE_SEQUENCE && mode !== Schedule.MDDE_RANDOM) {
            throw new Error(`don't support schedule mode: ${mode}`)
        }

        this.#mode = mode
        this.#cron = cron
        this.#texts = texts
        this.#overrideObjects = overrideObjects
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
    get overrideObjects() {
        return this.#overrideObjects
    }
    toJson() {
        return {
            mode: this.#mode,
            cron: this.#cron,
            texts: this.#texts,
            overrideObjects: this.#overrideObjects
        }
    }
}

module.exports = {
    Schedule: Schedule,
    Schedules: Schedules
}
