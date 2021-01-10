'use strict'

const NodeSchedule = require('node-schedule')
const { Schedule } = require('./schedule-vo.js')
const { TextConverter } = require('../../Utils/text-converter.js')


const Task = class {
    #bot
    #variables
    #schedules
    #jobs
    constructor(bot = null, variables = null, schedules = null) {
        this.#bot = bot
        this.#variables = variables
        this.#schedules = schedules
        this.#jobs = []
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

    getBot = () => {
        return this.#bot
    }
    getVariables = () => {
        return this.#variables
    }
    getSchedules = () => {
        return this.#schedules
    }
    toJson = () => {
        const json = {}
        json.bot = this.getBot().toJson()
        json.variables = this.getVariables().toJson()
        json.schedules = this.getSchedules().toJson()

        return json
    }
    start = () => {
        const _sequenceRun = (texts, textConverter) => {
            let index = 0
            return async () => {
                //console.log("sequence index: ", index)
                const res = await this.#bot.provider.post(textConverter.convert(texts[index]))
                //console.log('Message sent: ', res)

                index++
                if (texts.length === index) {
                    index = 0
                }
            }
        }
        const _randomRun = (texts, textConverter) => {
            return async () => {
                const index = Math.floor(Math.random() * texts.length)
                //console.log('random index: ', index)

                const res = await this.#bot.provider.post(textConverter.convert(texts[index]))
                //console.log('Message sent: ', res)
            }
        }


        const textConverter = new TextConverter()
        textConverter.setVariables(this.getVariables())

        this.#schedules.toList().forEach((schedule) => {
            try {
                let run = null
                switch (schedule.mode) {
                    case Schedule.MODE_SEQUENCE:
                        run = _sequenceRun(schedule.texts, textConverter)
                        break
                    case Schedule.MDDE_RANDOM:
                        run = _randomRun(schedule.texts, textConverter)
                        break
                    default:
                        run = _sequenceRun(schedule.texts, textConverter)
                        break
                }

                const job = NodeSchedule.scheduleJob(schedule.cron, async () => {
                    run()
                })

                this.#jobs.push(job)

            } catch (error) {
                console.log("job error: ", error)
            }
        })
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
}

module.exports = {
    Task: Task
}

