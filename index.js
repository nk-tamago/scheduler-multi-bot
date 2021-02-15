'use strict'

if (process.argv.length !== 3) {
    console.error("アプリケーション設定ファイルが必要")
    return
}

const NotificationService = require('./Service/notification-service.js')
const WebService = require('./Service/web-service.js')
const { logger } = require('./Utils/logger.js')
const config = require('./Utils/config-loader.js')



const main = async (appConfg) => {
    
    logger.debug("start")

    const notificationService = new NotificationService(appConfg)
    await notificationService.run()

    const webService = new WebService(notificationService)
    webService.run()
}

(async () =>{
    try {
        await main(config)
    }
    catch (e){
        logger.error("main error: ", e)
    }
})()