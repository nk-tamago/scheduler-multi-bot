'use strict'

const { RepositoryFactory } = require('../Repository/repository.js')

const TaskRunner = class {
    #tasks
    constructor() {
        this.#tasks = []
    }
    get tasks() {
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
        //console.log(task)
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
        this.stop()
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
    
}

const NotificationService = class {
    #repository
    #taskRunner
    constructor(config) {
        this.#repository = RepositoryFactory.createRepository(config.repository.type, config.repository.options)
    }
    run = async () => {

        // データロード
        if (await this.#repository.load() === false) {
            const massage = 'repository load error'
            console.log(massage)
            throw massage
        }

        // console.log(JSON.stringify( this.#repository.toJson(),undefined, 2))

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
        if(!this.#taskRunner) {
            return false
        }
        this.#taskRunner.stopAll()
        this.#taskRunner.clearAll()

        this.#taskRunner = null
    }
    restart = () => {
        if(!this.#taskRunner) {
            return false
        }
        return this.#taskRunner.restartAll()
    }
    getStatus = () => {
        if(!this.#taskRunner) {
            return {}
        }

        const status = this.#taskRunner.tasks.map( (task)=>{
            return { name: task.getName(), status: task.getStatus() }
        })

        return status
    }
    getTasks = () => {
        if(!this.#taskRunner) {
            return []
        }

        return this.#taskRunner.tasks
    }
    getTask = ( name ) => {
        if(!this.#taskRunner) {
            return null
        }

        const task = this.#taskRunner.tasks.find((t) => {
            return (name === t.getName())
        })
        return task ? task: null

    }
    addTask = (task) => {
        if(!this.#taskRunner) {
            return false
        }

        return this.#taskRunner.add(task)
    }
    updateTask = (name, task) =>{
        if(!this.#taskRunner) {
            return false
        }

        return this.#taskRunner.update(name, task)
    }
    deleteTask = (name) => {
        if(!this.#taskRunner) {
            return false
        }

        return this.#taskRunner.delete(name)
    }
    upsertTask = (name, task) => {
        if(!this.#taskRunner) {
            return false
        }
        if( this.#taskRunner.exists(name) === true ){
            return this.updateTask(name, task)
        }
        else {
            return this.addTask(task)
        }
    }
    startTask = (name) => {
        if(!this.#taskRunner) {
            return false
        }
        return this.#taskRunner.start(name)
    }
    stopTask = (name) => {
        if(!this.#taskRunner) {
            return false
        }
        return this.#taskRunner.stop(name)
    }

}

module.exports = NotificationService
