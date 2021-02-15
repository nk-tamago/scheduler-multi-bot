'use strict'

const fs = require('fs')

const { Variable, Variables } = require('../Models/Task/variable-vo.js')
const { Schedule, Schedules } = require('../Models/Task/schedule-vo.js')
const { Bot } = require('../Models/Task/bot-vo.js')
const { Task } = require('../Models/Task/task-entity.js')
const { logger } = require('../Utils/logger.js')


const BaseTaskRepository = class {
    #tasks
    constructor() {
        this.#tasks = []
    }
    get tasks() {
        return this.#tasks
    }
    setTasks(tasks) {
        this.#tasks = []
        this.#tasks = tasks
    }

    async save() {}
    async load() {}
    getTasks() {
        return this.#tasks
    }
    async addTask(task) {
        logger.debug(`BaseTaskRepository.addtask(${task.getName()})`)
        this.#tasks.push(task)
        await this.save()
    }
    toJson() {
        const json = {}
        json.tasks = []
        for (let task of this.#tasks) {
            json.tasks.push(task.toJson())
        }

        return json

    }
    async updateTask(name, task) {
        const index = this.#tasks.findIndex( (t) =>{
            return t.getName() === name
        })

        if(index >= 0){
            this.#tasks[index] = task
        }

        await this.save()

    }
    async deleteTask (name) {
        const index = this.#tasks.findIndex( (t) =>{
            return t.getName() === name
        })

        if(index >= 0){
            this.#tasks.splice(index, 1)
        }

        await this.save()
    }
    async fromJson (json) {

        if( json.tasks === undefined || Array.isArray(json.tasks) === false ){
            throw new Error(`[tasks] is not exists or is not Array`)
        }

        const tasks = json.tasks.map( (task) => {
            return Task.fromJson(task)
        })

        this.setTasks(tasks)
        await this.save()

        return tasks.length
    }
}

const JsonTaskRepository = class extends BaseTaskRepository {
    #path
    constructor(options) {
        super()

        if( !options.json || !options.json.path ){
            throw new Error("config error: repository.options.json.path not exists")
        }
        this.#path = options.json.path
    }
    load = async () => {
        const json = JSON.parse(fs.readFileSync(this.#path, 'utf8'))
        const tasks = []

        if (!json.tasks) {
            logger.warn("tasks is not exists: ", this.#path)
            return true
        }

        for (let taskJson of json.tasks) {
            if( this.tasks.some( t => t.name === taskJson.name) === true ){
                logger.error("task.name is exists: ", taskJson.name)
                return false
            }

            if (!taskJson.bot || !taskJson.bot.type || !taskJson.schedules) {
                logger.error("tasks[bot.type or schedules] is not exists: ", this.#path)
                return false
            }
            for (let schedule of taskJson.schedules) {
                if (!schedule.mode || !schedule.cron || !schedule.texts) {
                    logger.error("tasks.schedule[mode or cron or texts] is not exists: ", this.#path)
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

            tasks.push( new Task(taskJson.name, bot, variables, schedules) )
        }

        this.setTasks(tasks)

        return true
    }
    save = async () => {
        const json = await this.toJson()
        fs.writeFileSync(this.#path, JSON.stringify(json, undefined, 2), 'utf8')

    }
}


module.exports = {
    BaseTaskRepository: BaseTaskRepository,
    JsonTaskRepository: JsonTaskRepository
}
