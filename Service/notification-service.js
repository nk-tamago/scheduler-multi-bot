'use strict'

const { TaskRepositoryFactory } = require('../Repository/task-repository.js')
const { logger } = require('../Utils/logger.js')

const TaskRunner = class {
    #tasks
    constructor() {
        this.#tasks = []
    }
    gettasks = () => {
        return this.#tasks
    }
    getTask = (name) => {
        return this.#tasks.find((t) => name === t.getName())
    }
    exists = (name) => {
        return this.#tasks.some((t) => name === t.getName())
    }
    add = (task) => {
        if( this.#tasks.some((t) => task.name === t.getName()) === true ){
            return false
        }
        this.#tasks.push(task)

        return true
    }
    update = (name, task) => {
        const index= this.#tasks.findIndex((t) => name === t.getName())

        if( index === -1 ){
            return false
        }

        this.#tasks[index].stop()

        this.#tasks[index] = task

        this.#tasks[index].start()

        return true
    }
    delete = (name) => {
        const index= this.#tasks.findIndex((t) => name === t.getName())
        if( index === -1 ){
            return false
        }

        this.#tasks[index].stop()

        this.#tasks.splice(index, 1)
        return true

    }
    clear = () => {
        this.stopAll()
        this.#tasks = []
    }
    startAll = () => {
        for (let task of this.#tasks) {
            task.start()
        }
    }
    stopAll = () => {
        for (let task of this.#tasks) {
            task.stop()
        }
    }
    restartAll = () => {
        for (let task of this.#tasks) {
            task.restart()
        }
    }
    start = (name) => {
        const task = this.getTask(name)

        if( task === undefined){
            return false
        }
        task.start()

        return true
    }
    stop = (name) => {
        const task = this.getTask(name)

        if( task === undefined){
            return false
        }
        task.stop()

        return true
    }
    restart = (name) => {
        const task = this.getTask(name)

        if( task === undefined){
            return false
        }
        task.restart()

        return true
    }
   
    
}

const NotificationService = class {
    #repository
    #taskRunner = null
    constructor(config) {
        this.#repository = TaskRepositoryFactory.createRepository(config.repository.type, config.repository.options)
    }
    run = async () => {

        // データロード
        if (await this.#repository.load() === false) {
            const message = 'repository load error'
            logger.error(message)
            throw new Error(message)
        }

        // タスク一覧の取得
        this.#taskRunner = new TaskRunner()
        const tasks = this.#repository.getTasks()
        for (let task of tasks) {
            this.#taskRunner.add(task)
        }
        this.#taskRunner.startAll()

        return true
    }
    stop = () => {
        if(this.#taskRunner === null) {
            return false
        }
        this.#taskRunner.stopAll()
        this.#taskRunner.clearAll()

        this.#taskRunner = null
    }
    restart = () => {
        if(this.#taskRunner === null) {
            return false
        }
        return this.#taskRunner.restartAll()
    }
    getStatus = () => {
        if(this.#taskRunner === null) {
            return []
        }

        const status = this.#taskRunner.gettasks().map( (task)=>{
            return { name: task.getName(), status: task.getStatus() }
        })

        return status
    }
    getTasks = () => {
        if(this.#taskRunner === null) {
            return []
        }

        return this.#taskRunner.gettasks()
    }
    getTask = ( name ) => {
        if(this.#taskRunner === null) {
            return {}
        }

        const task = this.#taskRunner.gettasks().find((t) => {
            return (name === t.getName())
        })
        return task ? task: undefined

    }
    addTask = (task) => {
        if(this.#taskRunner === null) {
            return false
        }

        this.#repository.addTask(task)
        this.#repository.save()

        return this.#taskRunner.add(task)
    }
    updateTask = (name, task) =>{
        if(this.#taskRunner === null) {
            return false
        }

        this.#repository.updateTask(name, task)
        this.#repository.save()

        return this.#taskRunner.update(name, task)
    }
    deleteTask = (name) => {
        if(this.#taskRunner === null) {
            return false
        }

        this.#repository.deleteTask(name)
        this.#repository.save()
        return this.#taskRunner.delete(name)
    }
    startTask = (name) => {
        if(this.#taskRunner === null) {
            return false
        }
        return this.#taskRunner.start(name)
    }
    stopTask = (name) => {
        if(this.#taskRunner === null) {
            return false
        }
        return this.#taskRunner.stop(name)
    }
    exportJson = () => {
        return this.#repository.toJson()
    }
    importJson = (json) => {
        this.#repository.fromJson(json)
        this.#repository.save()
        const tasks = this.#repository.getTasks()
        this.#taskRunner.clear()
        for (let task of tasks) {
            this.#taskRunner.add(task)
        }
        this.#taskRunner.startAll()
    }

}

module.exports = NotificationService
