'use strict'

const fs = require('fs')

const { Variable, Variables } = require('../Models/Task/variable-vo.js')
const { Schedule, Schedules } = require('../Models/Task/schedule-vo.js')
const { Bot } = require('../Models/Task/bot-vo.js')
const { Task } = require('../Models/Task/task-entity.js')


const RepositoryFactory = class {
    static createRepository = (type, options = {}) => {
        let repository = null
        switch (type) {
            case "json":
                repository = new JsonRepository(options)
                break
            default:
                throw `don't support repository type: ${type}`
        }
        return repository
    }
}

const BaseRepository = class {
    #tasks
    constructor() {
        this.#tasks = []
    }
    get tasks() {
        return this.#tasks
    }

    load = async () => {
        this.#tasks = []
    }
    save = async () => { }
    getTasks = () => {
        return this.#tasks
    }
    setTasks = async (tasks) => {
        this.#tasks = tasks
    }
    addTask = (task) => {
        this.#tasks.push(task)
    }
    clear = () => {
        this.#tasks = []
    }
    getAllByJson = async () => {
        const json = {}
        json.tasks = []
        for (let task of this.#tasks) {
            json.tasks.push(task.toJson())
        }

        return json

    }

}

const JsonRepository = class extends BaseRepository {
    #path
    constructor(options) {
        super()
        this.#path = options.path
    }
    load = async () => {
        const json = JSON.parse(fs.readFileSync(this.#path, 'utf8'))

        if (!json.tasks) {
            console.log("tasks is not exists: ", this.#path)
            return false
        }

        for (let taskJson of json.tasks) {
            if (!taskJson.bot || !taskJson.bot.type || !taskJson.schedules) {
                console.log("tasks[bot.type or schedules] is not exists: ", this.#path)
                return false
            }
            for (let schedule of taskJson.schedules) {
                if (!schedule.mode || !schedule.cron || !schedule.texts) {
                    console.log("tasks.schedule[mode or cron or texts] is not exists: ", this.#path)
                    return false
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


            const task = new Task(bot, variables, schedules)

            this.tasks.push(task)
        }


        return true
    }
    save = async () => {
        const json = await this.getAllByJson()
        fs.writeFileSync(this.#path, JSON.stringify(json, undefined, 2), 'utf8')
    }
}


module.exports = {
    RepositoryFactory: RepositoryFactory,
    JsonRepository: JsonRepository
}
