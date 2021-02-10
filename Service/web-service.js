const express = require("express")
const cors = require("cors")
const bodyParser = require('body-parser');
const { Task } = require('../Models/Task/task-entity.js')

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

        this.#app.get("/health", (req, res) =>{
            res.send("ok")
        })

        this.#app.get("/status", (req, res) =>{
            try {
                const status = this.#notificationService.getStatus()

                res.send(status)
            } catch (e) {
                res.status(500).send(`${e}`)
            }
        })

        this.#app.get("/status/:name", (req, res) =>{

            try {
                const status = this.#notificationService.getStatus().find( (t) => req.params.name === t.name )
                res.send((status ? status : {}))
            } catch (e) {
                res.status(500).send(`${e}`)
            }
        })
        

        this.#app.get("/tasks",  (req, res) => {

            try {
                const tasks = this.#notificationService.getTasks().map( (t)=>{
                    return t.toJson()
                })
                res.send(tasks)
            } catch (e) {
                res.status(500).send(`${e}`)
            }
        })

        this.#app.get("/tasks/:name",  (req, res) => {
            try {
                const task = this.#notificationService.getTask(req.params.name)
                res.send( task ? task.toJson(): {} )
            } catch (e) {
                res.status(500).send(`${e}`)
            }
        })

        this.#app.get("/tasks/:name/start",  (req, res) => {
            try {
                this.#notificationService.startTask(req.params.name)
                res.status(204).send()
            } catch (e) {
                res.status(500).send(`${e}`)
            }
        })

        this.#app.get("/tasks/:name/stop",  (req, res) => {
            try {
                this.#notificationService.stopTask(req.params.name)
                res.status(204).send()
            } catch (e) {
                res.status(500).send(`${e}`)
            }
        })

        this.#app.post("/tasks",  (req, res) => {
            let task = null
            try {
                task = Task.fromJson(JSON.stringify(req.body))
            } catch (e) {
                res.status(400).send(`${e}`)
            }

            try {
                if( this.#notificationService.addTask(task) === false ){
                    res.status(400).send()
                }
                res.status(204).send()
            } catch (e) {
                res.status(500).send(`${e}`)
            }
            
        })

        this.#app.put("/tasks/:name",  (req, res) => {
            
            let task = null

            try {
                task = Task.fromJson(JSON.stringify(req.body))
            }
            catch(e){
                res.status(400).send(`${e}`)
            }

            try {
                this.#notificationService.updateTask(req.params.name, task)
                res.status(204).send()
                //res.send( {success : status} )
            }
            catch(e){
                res.status(500).send(`${e}`)
            }
        })

        this.#app.delete("/tasks/:name",  (req, res) => {
 
            try {
                if( this.#notificationService.deleteTask(req.params.name) === true ){
                    res.status(204).send()
                 }
            } catch (e) {
                res.status(500).send(`${e}`)
            }
        })

    }
}

module.exports = WebService