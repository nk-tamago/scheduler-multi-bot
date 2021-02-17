'use strict'

const fs = require('fs')

const { Task } = require('../Models/Task/task-entity.js')
const { logger } = require('../Utils/logger.js')

class BaseTaskRepository {
    #tasks
    constructor() {
        this.#tasks = []
    }
    get tasks() {
        return this.#tasks
    }
    setTasks(tasks) {
        const duplicateName = tasks.map( (t) => t.getName() ).filter((name, i, self) => self.indexOf(name) !== self.lastIndexOf(name))

        if( duplicateName.length > 0 ) {
            const names = duplicateName.filter((name, i, self) => self.indexOf(name) === i)
            throw new Error(`Repository.setTasks: task.name is exists: ${names.join(',')}`)
        } 
        this.#tasks = []
        this.#tasks = tasks

        return true
    }

    async save() {return true}
    async load() {return true}
    getTasks() {
        return this.#tasks
    }
    async addTask(task) {
        logger.debug(`BaseTaskRepository.addtask(${task.getName()})`)

        if( this.#tasks.some( t => t.getName() === task.getName()) === true ){
            throw new Error(`Repository.addTask: task.name is exists: ${task.getName()}`)
        }

        this.#tasks.push(task)
       
        await this.save()

        return true

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
        else {
            throw new Error(`Repository.updateTask: name is not exists: ${name}`)
        }

        await this.save()

        return true
    }
    async deleteTask(name) {
        const index = this.#tasks.findIndex( (t) =>{
            return t.getName() === name
        })

        if(index >= 0){
            this.#tasks.splice(index, 1)
        }
        else {
            throw new Error(`Repository.deleteTask: name is not exists: ${name}`)
        }

        await this.save()

        return true
    }
    async fromJson(json) {

        if( json.tasks === undefined || Array.isArray(json.tasks) === false ){
            throw new Error(`Repository.fromJson: [tasks] is not exists or is not Array`)
        }

        const tasks = json.tasks.map( (task) => {
            return Task.fromJson(task)
        })

        this.setTasks(tasks)

        await this.save()

        return tasks.length
    }
}

class JsonTaskRepository extends BaseTaskRepository {
    #path
    constructor(options) {
        super()

        if( !options.json || !options.json.path ){
            throw new Error("config error: repository.options.json.path not exists")
        }
        this.#path = options.json.path
    }
    async load() {
        let json = {}
        try {
            json = JSON.parse(fs.readFileSync(this.#path, 'utf8'))
        }
        catch (e) {
            logger.warn(`json file is not exists: ${this.#path}`)
            return true
        }

        if (!json.tasks) {
            logger.warn(`tasks is not exists: ${this.#path}`)
            return true
        }

        if( json.tasks === undefined || Array.isArray(json.tasks) === false ){
            throw new Error(`Repository.fromJson: [tasks] is not exists or is not Array`)
        }

        const tasks = json.tasks.map( (task) => {
            return Task.fromJson(task)
        })

        this.setTasks(tasks)

        return true
    }
    async save() {
        const json = await this.toJson()
        fs.writeFileSync(this.#path, JSON.stringify(json, undefined, 2), 'utf8')
    }
}

module.exports = {
    BaseTaskRepository: BaseTaskRepository,
    JsonTaskRepository: JsonTaskRepository
}
