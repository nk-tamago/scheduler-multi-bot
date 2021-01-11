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
    constructor(config) {
        this.#repository = RepositoryFactory.createRepository(config.repository.type, config.repository.options)
    }
    runTasks = async () => {

        // データロード
        if (await this.#repository.load() === false) {
            console.log("repository load error")
            return
        }

        // console.log(JSON.stringify( this.#repository.toJson(),undefined, 2))

        // タスク一覧の取得
        const taskRunner = new TaskRunner()
        const tasks = this.#repository.getTasks()
        for (let task of tasks) {
            taskRunner.add(task)
        }
        taskRunner.start()
    }
}

module.exports = NotificationService
