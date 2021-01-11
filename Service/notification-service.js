'use strict'

const { RepositoryFactory } = require('../Repository/repository.js')

const TaskRunner = class {
    #tasks
    constructor() {
        this.#tasks = []
    }
    add = (task) => {
        this.#tasks.push(task)
    }
    clear = () => {
        this.stop()
        this.#tasks = []
    }
    start = () => {
        this.#tasks.forEach((task) => {
            task.start()
        })
    }
    stop = () => {
        this.#tasks.forEach((task) => {
            task.stop()
        })
    }
    restart = () => {
        this.#tasks.forEach((task) => {
            task.restart()
        })
    }
}

const NotificationService = class {
    #repository
    #taskRunner
    constructor(config) {
        this.#repository = RepositoryFactory.createRepository(config.repository.type, config.repository.options)
    }
    start = async () => {

        // データロード
        if (await this.#repository.load() === false) {
            console.log("repository load error")
            return false
        }

        // console.log(JSON.stringify( this.#repository.toJson(),undefined, 2))

        // タスク一覧の取得
        this.#taskRunner = new TaskRunner()
        const tasks = this.#repository.getTasks()
        for (let task of tasks) {
            this.#taskRunner.add(task)
        }
        this.#taskRunner.start()

        return true
    }
    stop = async () => {
        if(!this.#taskRunner) {
            return false
        }
        this.#taskRunner.stop()
        this.#taskRunner.clear()

        this.#taskRunner = null
    }
}

module.exports = NotificationService
