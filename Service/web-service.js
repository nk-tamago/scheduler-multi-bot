const express = require("express")
const cors = require("cors")
const bodyParser = require('body-parser');
const { Task } = require('../Models/Task/task-entity.js')

const wrap = fn => (...args) => fn(...args).catch(args[2])


const ResponseStatus = class {
    #name 
    #status
    constructor( name, status) {
        this.#name = name
        this.#status = status
    }
    toJson = () => {
        return { name: this.#name, status: this.#status }
    }
}

const ResponseTask = class {
    #task
    constructor(task) {
        this.#task = task
    }
    toJson = () => {
        return this.#task.toJson()
    }
}

const ResponseError = class {
    static NAME_NOT_FIND = "Name not find"
    static TASK_EXISTS = "Task exists"
    static ILLEGAL_BODY = "Illegal body"
    #message
    constructor(message) {
        this.#message = message
    }
    toJson = () => {
        return { message: this.#message }
    }
}


const WebService = class {
    #notificationService
    #tasks
    #app
    constructor( notificationService ) {
        this.#notificationService = notificationService
        this.#app = express()
        this.#app.use(cors())
        this.#app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.#app.use(bodyParser.json());
        this.#tasks = []
    }
    run = () => {
        this.#app.listen(process.env.PORT || 3000)

        this.#app.get("/health", wrap( async (req, res, next) => {
            return res.json()
        }))

        this.#app.get("/status", wrap( async (req, res, next) =>{
            const resBody = this.#notificationService.getStatus().map( (s) => {
                return (new ResponseStatus(s.name, s.status)).toJson()
           })
 
            return res.json(resBody)
        }))

        this.#app.get("/status/:name", wrap( async (req, res, next) => {
            const status = this.#notificationService.getStatus().find( (t) => req.params.name === t.name )
            if( status === undefined ){
                return res.status(400).json((new ResponseError( ResponseError.NAME_NOT_FIND )).toJson())
            }
            const resObj = new ResponseStatus(req.params.name, status.status )
            return res.json(resObj.toJson())
        }))
        

        this.#app.get("/tasks", wrap( async (req, res, next) => {
            const resBody = this.#notificationService.getTasks().map( (t)=>{
                return (new ResponseTask(t)).toJson()
            })
            return res.json(resBody)
        }))

        this.#app.get("/tasks/:name", wrap( async (req, res, next) => {
            const task = this.#notificationService.getTask(req.params.name)
            if( task === undefined ){
                return res.status(400).json((new ResponseError(ResponseError.NAME_NOT_FIND )).toJson())
            }
            const resObj = new ResponseTask(task)

            return res.json( resObj.toJson())
        }))

        this.#app.get("/tasks/:name/start", wrap( async (req, res, next) => {
            this.#notificationService.startTask(req.params.name)
            return res.status(204).json()
        }))

        this.#app.get("/tasks/:name/stop", wrap( async (req, res, next) => {
            this.#notificationService.stopTask(req.params.name)
            return res.status(204).json()
        }))

        this.#app.post("/tasks", wrap( async (req, res, next) => {
            let task = null
            try {
                task = Task.fromJson(JSON.stringify(req.body))
            } catch (e) {
                return res.status(400).json((new ResponseError(ResponseError.ILLEGAL_BODY )).toJson())
            }

            if( this.#notificationService.addTask(task) === false ){
                return res.status(400).json((new ResponseError(ResponseError.TASK_EXISTS )).toJson())
            }
            return res.status(204).json()
        }))

        this.#app.put("/tasks/:name", wrap( async (req, res, next) => {
            let task = null

            try {
                task = Task.fromJson(JSON.stringify(req.body))
            }
            catch(e){
                return res.status(400).json((new ResponseError(ResponseError.ILLEGAL_BODY)).toJson())
            }

            if( this.#notificationService.updateTask(req.params.name, task) === false ){
                return res.status(400).json((new ResponseError(ResponseError.NAME_NOT_FIND )).toJson())
            }
            return res.status(204).json()
        }))

        this.#app.delete("/tasks/:name", wrap( async (req, res, next) => {
 
            this.#notificationService.deleteTask(req.params.name)
            return res.status(204).json()
        }))

        this.#app.use((err, req, res, next) => {
            console.error(err.stack)
            return res.status(500).send(`Internal Server Error\n${err.message}`)
        })

    }
}

module.exports = WebService