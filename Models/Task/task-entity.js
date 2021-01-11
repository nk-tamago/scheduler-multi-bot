'use strict'

const NodeSchedule = require('node-schedule')
const { Schedule } = require('./schedule-vo.js')
const { TextConverter } = require('../../Utils/text-converter.js')


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
        if( !this.getBot() || !this.getVariables() || !this.getSchedule() || !this.getName() ){
            return false
        }
        return true
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

        if( !this.canStart() ){
            console.log("can't task start: ", JSON.stringify(this.toJson()))
            return []
        }
        if( this.isJobs() ){
            console.log("job exists: ", this.#jobs)
            return []
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
                throw `job error: ${error}`
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
    getJobs = () =>{
        return this.#jobs
    }
    isJobs = () =>{
        if( this.#jobs.length > 0 ){
            return true
        }
        return false
    }
}

module.exports = {
    Task: Task
}

