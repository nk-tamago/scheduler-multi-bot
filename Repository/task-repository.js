'use strict'

const fs = require('fs')

const { Variable, Variables } = require('../Models/Task/variable-vo.js')
const { Schedule, Schedules } = require('../Models/Task/schedule-vo.js')
const { Bot } = require('../Models/Task/bot-vo.js')
const { Task } = require('../Models/Task/task-entity.js')
const logger = require('../Utils/logger.js')


const TaskRepositoryFactory = class {
    static createRepository = (type, options = {}) => {
        let repository = null
        switch (type) {
            case "json":
                repository = new JsonTaskRepository(options)
                break
            default:
                throw new Error(`don't support repository type: ${type}`)
        }
        return repository
    }
}

const BaseTaskRepository = class {
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
    setTasks = (tasks) => {
        this.#tasks = tasks
    }
    addTask = (task) => {
        this.#tasks.push(task)
    }
    clear = () => {
        this.#tasks = []
    }
    toJson = () => {
        const json = {}
        json.tasks = []
        for (let task of this.#tasks) {
            json.tasks.push(task.toJson())
        }

        return json

    }
    updateTask = (name, task) =>{
        const index = this.#tasks.findIndex( (t) =>{
            return t.getName() === name
        })

        if(index >= 0){
            this.#tasks[index] = task
        }
    }

}

const JsonTaskRepository = class extends BaseTaskRepository {
    #path
    constructor(options) {
        super()
        this.#path = options.path
    }
    load = async () => {
        const json = JSON.parse(fs.readFileSync(this.#path, 'utf8'))

        const _taskPush = (task) =>{
            if( this.tasks.some( target => target.name === task.name) ){
                logger.error("task.name is exists: ", task.name)
                return false
            }
            this.tasks.push(task)
            return true
        } 

        if (!json.tasks) {
            logger.error("tasks is not exists: ", this.#path)
            return false
        }

        for (let taskJson of json.tasks) {
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


            const task = new Task(taskJson.name, bot, variables, schedules)

            if( !_taskPush(task) ){
                return false
            }
        }


        return true
    }
    save = async () => {
        const json = await this.getAllByJson()
        fs.writeFileSync(this.#path, JSON.stringify(json, undefined, 2), 'utf8')
    }
}


module.exports = {
    TaskRepositoryFactory: TaskRepositoryFactory,
    TaskJsonRepository: JsonTaskRepository
}
