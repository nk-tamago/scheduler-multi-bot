'use strict'

const NodeSchedule = require('node-schedule')
const { TextConverter } = require('../../Utils/text-converter.js')
const { Variable, Variables } = require('./variable-vo.js')
const { Schedule, Schedules } = require('./schedule-vo.js')
const { Bot } = require('./bot-vo.js')
const { logger } = require('../../Utils/logger.js')
const { JsonValidator } = require('../../Utils/json-validator.js');


class Task {
    #name
    #bot
    #variables
    #schedules
    #jobs

    constructor(name = null, bot = null, variables = null, schedules = null) {
        this.#name = name
        this.#bot = bot
        this.#variables = variables
        this.#schedules = schedules
        this.#jobs = []
    }

    static fromJson(json) {
        const validate = new JsonValidator(JsonValidator.taskSchema)
        
        if( validate.valid(json) === false ){
            throw new Error(`Task.fromJson: Task json validation is error`)
        }

        const bot = new Bot(json.bot.type, json.bot.options)
        const variables = new Variables()

        if (json.variables) {
            for (let variableJson of json.variables) {
                const variable = new Variable(variableJson.type, variableJson.key, variableJson.value)
                variables.add(variable)
            }
        }

        const schedules = new Schedules()
        for (let scheduleJson of json.schedules) {
            const schedule = new Schedule(scheduleJson.mode, scheduleJson.cron, scheduleJson.texts, scheduleJson.overrideObjects)
            schedules.add(schedule)
        }

        const task = new Task(json.name, bot, variables, schedules)

        return task
    }

    setBot(bot) {
        this.#bot = bot
    }
    setVariables(variables) {
        this.#variables = variables
    }
    setSchedules(schedules) {
        this.#schedules = schedules
    }
    setName(name) {
        this.#name = name
    }

    getBot() {
        return this.#bot
    }
    getVariables() {
        return this.#variables
    }
    getSchedules() {
        return this.#schedules
    }
    getName() {
        return this.#name
    }
    toJson() {
        const json = {}
        json.name = this.getName()
        json.bot = this.getBot().toJson()
        json.variables = this.getVariables().toJson()
        json.schedules = this.getSchedules().toJson()

        return json
    }
    canStart() {
        if( !this.getBot() || !this.getVariables() || !this.getSchedules() || !this.getName() ){
            return false
        }
        return true
    }
    start() {
        logger.debug(`Task.start(${this.#name})`)
        const sequenceRun = (texts, overrideObjects, textConverter) => {
            let index = 0
            return async () => {
                try {
                    let length = 0
                    if( overrideObjects && overrideObjects.length > 0 ){
                        const custom = JSON.parse(textConverter.convert(JSON.stringify(overrideObjects[index])))
                        await this.#bot.provider.customPost(custom)
                        length = overrideObjects.length
                    }
                    else {
                        await this.#bot.provider.simpleTextPost(textConverter.convert(texts[index]))
                        length = texts.length
                    }
                    index++
                    if (length === index) {
                        index = 0
                    }
                }
                catch(e) {
                    logger.error(`sequenceRun error: ${e.stack}`)
                }
            }
        }
        const randomRun = (texts, overrideObjects, textConverter) => {
            return async () => {
                try {
                    if( overrideObjects && overrideObjects.length > 0 ){
                        const index = Math.floor(Math.random() * overrideObjects.length)
                        const custom = JSON.parse(textConverter.convert(JSON.stringify(overrideObjects[index])))
                        await this.#bot.provider.customPost(custom)
                    }
                    else {
                        const index = Math.floor(Math.random() * texts.length)
                        await this.#bot.provider.simpleTextPost(textConverter.convert(texts[index]))
                    }
                }
                catch(e){
                    logger.error(`randomRun error: ${e.stack}`)
                }
            }
        }

        if( this.isJobs() ){
            const message = `run tasks: ${this.getName()}`
            logger.error(message)
            return []
        }
        if( !this.canStart() ){
            const message = `can't task start: ${this.getName()}`
            logger.error(message)
            return []
        }


        const textConverter = new TextConverter()
        textConverter.setVariables(this.getVariables())

        this.#schedules.toList().forEach((schedule) => {
            try {
                let run = null
                switch (schedule.mode) {
                    case Schedule.MODE_SEQUENCE:
                        run = sequenceRun(schedule.texts, schedule.overrideObjects, textConverter)
                        break
                    case Schedule.MDDE_RANDOM:
                        run = randomRun(schedule.texts, schedule.overrideObjects, textConverter)
                        break
                    default:
                        run = sequenceRun(schedule.texts, schedule.overrideObjects, textConverter)
                        break
                }

                const job = NodeSchedule.scheduleJob(schedule.cron, async () => {
                    run()
                })

                this.#jobs.push(job)

            } catch (error) {
                const message = `job error: ${error}`
                throw new Error(message)
            }
        })

        return this.#jobs
    }
    stop() {
        console.debug(`Task.stop(${this.#name})`)
        for (let job of this.#jobs) {
            job.cancel()
        }
        this.#jobs = []
    }
    restart() {
        console.debug(`Task.restart(${this.#name})`)
        this.stop()
        this.start()
    }
    getJobs() {
        return this.#jobs
    }
    isJobs() {
        if( this.#jobs.length > 0 ){
            return true
        }
        return false
    }
    getStatus() {
        return this.isJobs() ? "run" : "stop"
    }
}

module.exports = {
    Task: Task
}

