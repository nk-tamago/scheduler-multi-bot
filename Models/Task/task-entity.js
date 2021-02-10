'use strict'

const NodeSchedule = require('node-schedule')
const { TextConverter } = require('../../Utils/text-converter.js')
const { Variable, Variables } = require('./variable-vo.js')
const { Schedule, Schedules } = require('./schedule-vo.js')
const { Bot } = require('./bot-vo.js')


const Task = class {
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

    static fromJson = ( jsonString ) => {
        const taskJson = JSON.parse( jsonString )

        if (!taskJson.bot || !taskJson.bot.type || !taskJson.schedules) {
            throw new Error(`[bot.type or schedules] is not exists`)
        }
        for (let schedule of taskJson.schedules) {
            if (!schedule.mode || !schedule.cron || !schedule.texts) {
                throw new Error(`schedule[mode or cron or texts] is not exists`)
            }
        }

        const bot = new Bot(taskJson.bot.type, taskJson.bot.options)
        const variables = new Variables()

        if (taskJson.variables) {
            for (let variableJson of taskJson.variables) {
                const variable = new Variable(variableJson.type, variableJson.key, variableJson.value)
                variables.add(variable)
            }
        }

        const schedules = new Schedules()
        for (let scheduleJson of taskJson.schedules) {
            const schedule = new Schedule(scheduleJson.mode, scheduleJson.cron, scheduleJson.texts)
            schedules.add(schedule)
        }


        const task = new Task(taskJson.name, bot, variables, schedules)

        return task

    }

    setBot = (bot) => {
        this.#bot = bot
    }
    setVariables = (variables) => {
        this.#variables = variables
    }
    setSchedules = (schedules) => {
        this.#schedules = schedules
    }
    setName = (name) => {
        this.#name = name
    }

    getBot = () => {
        return this.#bot
    }
    getVariables = () => {
        return this.#variables
    }
    getSchedules = () => {
        return this.#schedules
    }
    getName = () => {
        return this.#name
    }
    toJson = () => {
        const json = {}
        json.name = this.getName()
        json.bot = this.getBot().toJson()
        json.variables = this.getVariables().toJson()
        json.schedules = this.getSchedules().toJson()

        return json
    }
    canStart = () => {
        if( !this.getBot() || !this.getVariables() || !this.getSchedules() || !this.getName() ){
            return false
        }
        return true
    }
    start = () => {
        const sequenceRun = (texts, textConverter) => {
            let index = 0
            return async () => {
                const res = await this.#bot.provider.post(textConverter.convert(texts[index]))

                index++
                if (texts.length === index) {
                    index = 0
                }
            }
        }
        const randomRun = (texts, textConverter) => {
            return async () => {
                const index = Math.floor(Math.random() * texts.length)

                const res = await this.#bot.provider.post(textConverter.convert(texts[index]))
            }
        }

        if( this.isJobs() ){
            const massage = `run tasks: ${this.getName()}`
            throw new Error(massage)
        }
        if( !this.canStart() ){
            const massage = `can't task start: ${this.getName()}`
            throw new Error(massage)
        }


        const textConverter = new TextConverter()
        textConverter.setVariables(this.getVariables())

        this.#schedules.toList().forEach((schedule) => {
            try {
                let run = null
                switch (schedule.mode) {
                    case Schedule.MODE_SEQUENCE:
                        run = sequenceRun(schedule.texts, textConverter)
                        break
                    case Schedule.MDDE_RANDOM:
                        run = randomRun(schedule.texts, textConverter)
                        break
                    default:
                        run = sequenceRun(schedule.texts, textConverter)
                        break
                }

                const job = NodeSchedule.scheduleJob(schedule.cron, async () => {
                    run()
                })

                this.#jobs.push(job)

            } catch (error) {
                const massage = `job error: ${error}`
                throw new Error(massage)
            }
        })

        return this.#jobs
    }
    stop = () => {
        for (let job of this.#jobs) {
            job.cancel()
        }
        this.#jobs = []
    }
    restart = () => {
        this.stop()
        this.start()
    }
    getJobs = () => {
        return this.#jobs
    }
    isJobs = () => {
        if( this.#jobs.length > 0 ){
            return true
        }
        return false
    }
    getStatus = () => {
        return this.isJobs() ? "run" : "stop"
    }
}

module.exports = {
    Task: Task
}

