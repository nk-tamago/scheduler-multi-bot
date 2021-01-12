const express = require("express")
const cors = require("cors")


const WebService = class {
    #tasks
    #app
    constructor() {
        this.#app = express()
        this.#app.use(cors())
        this.#tasks = []
    }
    addTask = (task) => {
        this.#tasks.push( task )
    }
    crearTasks = () => {
        this.#tasks = []
    }
    start = () => {
        this.#app.listen(process.env.PORT || 3000)

        this.#app.get("/health", (req, res) =>{
            res.send("ok")
        })

        this.#app.get("/status", (req, res) =>{
            const status = this.#tasks.map( (task)=>{
                return {"name": task.getName(), "run": task.isJobs()}
            })

            res.send(status)
        })

        this.#app.get("/status/:name", (req, res) =>{
            const task = this.#tasks.find((t) => {
                return (req.params.name === t.getName())
            })

            res.send((task ? {"name": task.getName(), "run": task.isJobs()} : {}))
        })

        this.#app.get("/tasks",  (req, res) => {
            const tasks = this.#tasks.map( (t)=>{
                return t.toJson()
            })
            res.send(tasks)
        })

        this.#app.get("/tasks/:name",  (req, res) => {
            const task = this.#tasks.find((t) => {
                return (req.params.name === t.getName())
            })
            res.send( task ? task.toJson(): {} )
        })
        
    }
}

module.exports = WebService