'use strict'

if (process.argv.length !== 3) {
    console.error("アプリケーション設定ファイルが必要")
    return
}

const NotificationService = require('./Service/notification-service.js')
const fs = require('fs')

const appConfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))

const main = async (appConfg) => {

//    console.log("start")

    if (!appConfg.repository || !appConfg.repository.type || !appConfg.repository.options) {
        console.log("config error: repository not exists")
        return
    }

    const service = new NotificationService(appConfg)
    await service.runTasks()

//    console.log("end")
}

try {
    main(appConfg)
}
catch (error) {
    console.log("main error: ", error)
}
