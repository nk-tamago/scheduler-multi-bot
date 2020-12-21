'use strict'

const NodeSchedule = require('node-schedule')

const SCHEDULE_MODE_SEQUENCE = "sequence"
const SCHEDULE_MODE_RANDOM = "random"

const TaskRunner = class {
    #bot
    #tasks
    constructor(bot) {
        this.#bot = bot
        this.#tasks = new Array()
    }
    add = (cron, texts, mode) => {
        this.#tasks.push({ cron: cron, texts: texts, mode: mode })
    }
    #sequenceRun = (texts) => {
        let index = 0
        return async () => {
            //console.log("sequence index: ", index)

            const res = await this.#bot.post(texts[index])
            //console.log('Message sent: ', res)

            index++
            //console.log(index)
            if (texts.length === index) {
                //console.log("clear")
                index = 0
            }
        }
    }
    #randomRun = (texts) => {
        return async () => {
            const index = Math.floor(Math.random() * texts.length)
            //console.log('random index: ', index)

            const res = await this.#bot.post(texts[index])
            //console.log('Message sent: ', res)
        }
    }
    run = () => {
        this.#tasks.forEach((task) => {
            try {
                let _run = null
                switch (task.mode) {
                    case SCHEDULE_MODE_SEQUENCE:
                        _run = this.#sequenceRun(task.texts)
                        break
                    case SCHEDULE_MODE_RANDOM:
                        _run = this.#randomRun(task.texts)
                        break
                    default:
                        _run = this.#sequenceRun(task.texts)
                        break
                }

                NodeSchedule.scheduleJob(task.cron, async () => {
                    _run()
                })
            } catch (error) {
                console.log("job error: ", error)
            }
        })
    }
}


module.exports = {
    TaskRunner : TaskRunner
}
