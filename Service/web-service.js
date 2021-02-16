const express = require("express")
const cors = require("cors")
const bodyParser = require('body-parser');
const { Task } = require('../Models/Task/task-entity.js')
const { logger, Logger } = require('../Utils/logger.js')
const morgan = require('morgan')

const wrap = fn => (...args) => fn(...args).catch(args[2])

class ResponseStatus {
    #name 
    #status
    constructor( name, status) {
        this.#name = name
        this.#status = status
    }
    toJson() {
        return { name: this.#name, status: this.#status }
    }
}

class ResponseTask {
    #task
    constructor(task) {
        this.#task = task
    }
    toJson() {
        return this.#task.toJson()
    }
}

class ResponseError {
    static NAME_NOT_FIND = "Name not find"
    static TASK_EXISTS = "Task exists"
    static ILLEGAL_BODY = "Illegal body"
    static ILLEGAL_PATH_PARAM = "Illegal path parameter"
    static ILLEGAL_QUERY_PARAM = "Illegal query parameter"
    #message
    #args
    constructor(message, ...args) {
        this.#message = message
        this.#args = args
    }
    toJson() {
        logger.error( `message:${this.#message}, param:${this.#args.join(",")}`)
        return { message: this.#message, param: this.#args.join(",") }
    }
}


class WebService {
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
        this.#app.use(bodyParser.json())
        this.#app.use(morgan('tiny', {
            stream: {
              write: message => logger.http(message.trim()),
            },
          }))
        this.#tasks = []
    }
    run() {

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
                task = Task.fromJson(req.body)
            } catch (e) {
                return res.status(400).json((new ResponseError(ResponseError.ILLEGAL_BODY, e)).toJson())
            }

            if( this.#notificationService.addTask(task) === false ){
                return res.status(400).json((new ResponseError(ResponseError.TASK_EXISTS )).toJson())
            }
            return res.status(204).json()
        }))

        this.#app.put("/tasks/:name", wrap( async (req, res, next) => {
            let task = null

            try {
                task = Task.fromJson(req.body)
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

        this.#app.get("/logs/:date", wrap( async (req, res, next) => {
            const parseDate = (str) => {
                if( str.length !== 8 ){
                    return null
                }
                const yyyy = parseInt(str.substr(0,4))
                const mm = parseInt(str.substr(4,2))
                const dd = parseInt(str.substr(6,2))

                if( isNaN(yyyy) || isNaN(mm) || isNaN(dd) ){
                    return null
                }
                // mmは0オリジンなので注意
                return new Date(yyyy, mm-1, dd)
            }

            const getLimit = (query) => {
                if( query.limit === undefined ){
                    return 1000
                }
                const limit = parseInt(query.limit)
                if( isNaN(limit) ){
                    return null
                } 
                return limit
            }

            const getOrder = (query) => {
                if( query.order === undefined || query.order === "desc" ){
                    return "desc"
                }
                if(query.order === "asc"){
                    return "asc"
                }

                return null
            }

            const getLevel = (query) => {
                if( query.level === undefined ){
                    return ""
                }
                if( Logger.levels.some( (l) => l === query.level) === true ){
                    return query.level
                }
                return null
            }

            const fromDate = parseDate(req.params.date)
            if( fromDate === null ){
                return res.status(400).json((new ResponseError(ResponseError.ILLEGAL_PATH_PARAM )).toJson())
            }

            const limit = getLimit(req.query)
            if( limit === null ){
                return res.status(400).json((new ResponseError(ResponseError.ILLEGAL_QUERY_PARAM, "limit")).toJson())
            }

            const order = getOrder(req.query)
            if( order === null ){
                return res.status(400).json((new ResponseError(ResponseError.ILLEGAL_QUERY_PARAM, "order")).toJson())
            }

            const level = getLevel(req.query)
            if( level === null ){
                return res.status(400).json((new ResponseError(ResponseError.ILLEGAL_QUERY_PARAM, "level")).toJson())
            }

            const options = {
                from: fromDate.getTime(),
                until: fromDate.getTime() + ((24 * 60 * 60 * 1000)-1),
                limit: limit,
                start: 0,
                order: order,
                level: level,
                fields: ['timestamp','level','message']
              }
              
              const results = await logger.query(options)
              return res.json(results)
           
        }))

        this.#app.get("/export", wrap( async (req, res, next) => {
            const results = this.#notificationService.exportJson()
            return res.json( results )
        }))

        this.#app.post("/import", wrap( async (req, res, next) => {
            try {
                const count = this.#notificationService.importJson(req.body)
                return res.json({count:count})
            }
            catch(err){
                return res.status(400).json((new ResponseError(ResponseError.ILLEGAL_BODY)).toJson())
            }
        }))

        this.#app.use((err, req, res, next) => {
            logger.error(err.stack)
            return res.status(500).send(`Internal Server Error\n${err.message}`)
        })

        this.#app.listen(process.env.PORT || 3000)

    }
}

module.exports = WebService