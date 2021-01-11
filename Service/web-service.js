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
            this.#tasks.map( (task)=>{
                task.isJobs()
            })
            res.send("ok")
        })

        this.#app.get("/tasks",  (req, res) => {
            res.send({
              message: "Hello world!"
            })
        })
        
        this.#app.put("/tasks")
    }
}