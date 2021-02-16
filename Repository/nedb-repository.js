'use strict'

const { Variable, Variables } = require('../Models/Task/variable-vo.js')
const { Schedule, Schedules } = require('../Models/Task/schedule-vo.js')
const { Bot } = require('../Models/Task/bot-vo.js')
const { Task } = require('../Models/Task/task-entity.js')
const { logger } = require('../Utils/logger.js')
const { BaseTaskRepository } = require('./base-repository.js')
const nedb = require('nedb')
const util = require('util')

class NedbTaskRepository extends BaseTaskRepository {
    #db
    #path
    #promiseFind
    #promiseInsert
    #promiseUpdate
    #promiseRemove
    constructor(options) {
        super()

        if( !options.nedb || !options.nedb.path ){
            throw new Error("config error: repository.options.nedb.path not exists")
        }

        this.#path = options.nedb.path
        this.#db = new nedb({ 
            filename: this.#path,
            autoload: true,
            timestampData: true
        })

        this.#db.ensureIndex({ fieldName: "task.name", unique: true }, (err) => {
            if( err !== null) {
                throw new Error(err)
            }
        })

        this.#promiseFind = util.promisify(this.#db.find).bind(this.#db)
        this.#promiseInsert = util.promisify(this.#db.insert).bind(this.#db)
        this.#promiseUpdate = util.promisify(this.#db.update).bind(this.#db)
        this.#promiseRemove = util.promisify(this.#db.remove).bind(this.#db)

    }

    async load() {
        logger.debug(`NedbTaskRepository.load(${this.#path})`)

        const tasks = []

        const json = await this.#promiseFind({})

        if (json.length === 0) {
            logger.warn("tasks is not exists: ", this.#path)
            return true
        }

        let task = null
        for (let taskJson of json) {
            task = taskJson.task
            if( this.tasks.some( t => t.name === task.name) === true ){
                logger.error("task.name is exists: ", task.name)
                return false
            }

            if (!task.bot || !task.bot.type || !task.schedules) {
                logger.error("tasks[bot.type or schedules] is not exists: ", this.#path)
                return false
            }
            for (let schedule of task.schedules) {
                if (!schedule.mode || !schedule.cron || !schedule.texts) {
                    logger.error("tasks.schedule[mode or cron or texts] is not exists: ", this.#path)
                    return false
                }
            }

            const bot = new Bot(task.bot.type, task.bot.options)
            const variables = new Variables()

            if (task.variables) {
                for (let variableJson of task.variables) {
                    const variable = new Variable(variableJson.type, variableJson.key, variableJson.value)
                    variables.add(variable)
                }
            }

            const schedules = new Schedules()
            for (let scheduleJson of task.schedules) {
                const schedule = new Schedule(scheduleJson.mode, scheduleJson.cron, scheduleJson.texts)
                schedules.add(schedule)
            }

            tasks.push( new Task(task.name, bot, variables, schedules) )
        }

        this.setTasks(tasks)

        return true

    }
    async addTask(task) {
        logger.debug(`NedbTaskRepository.addtask(${task.getName()})`)
        super.addTask(task)

        try {
            await this.#promiseInsert({task: task.toJson()})
        }
        catch(err) {
            throw new Error(err)
        }
    }
    async updateTask(name, task) {
        logger.debug(`NedbTaskRepository.updateTask(${name})`)
        super.updateTask(name, task)

        try {
            await this.#promiseUpdate({"task.name": name}, {$set:{task:task.toJson()}}, {})
        }
        catch(err) {
            throw new Error(err)
        }
    }
    async deleteTask(name) {
        logger.debug(`NedbTaskRepository.deleteTask(${name})`)
        super.deleteTask(name)
        try {
            await this.#promiseRemove({"task.name": name}, {})
        }
        catch(err) {
            throw new Error(err)
        }

    }

    async fromJson(json) {
        logger.debug(`NedbTaskRepository.fromJson()`)

        try {
            const count = await super.fromJson(json)
            await this.#promiseRemove({}, {multi: true})
            const tasks = this.getTasks().map( (task) => {
                return { task : task.toJson()}
            })
            // bulk insert
            await this.#promiseInsert(tasks)

            return count
        }
        catch(err) {
            throw new Error(err)
        }
    }
}

module.exports = {
    NedbTaskRepository: NedbTaskRepository
}
