const { BotProviderFactory } = require('../Provider/bot-provider.js')
const { TaskRunner } = require('../Utils/task-runner.js')
const { TextConverter } = require('../Utils/text-converter.js')
const { RepositoryFactory } = require('../Repository/repository.js')


const NotificationService = class {
    #repository
    constructor(config) {
        this.#repository = RepositoryFactory.createRepository(config.repository.type, config.repository.options)
    }
    runTasks = async () => {
        const _initTextConvert = async (repository) =>{
            // 変数一覧の取得
            const staticVariables = await repository.getStaticVariables()
            const dynamicVariables = await repository.getDynamicVariables()

            const textConverter = new TextConverter()

            // コンバータに変数を入力
            staticVariables.forEach((variable) => {
                textConverter.addStaticVariable(variable.key, variable.value)
            })
            dynamicVariables.forEach((variable) => {
                textConverter.addDynamicVariable(variable.key, variable.value)
            })

            return textConverter
        }

        // データロード
        await this.#repository.load()

        const textConverter = await _initTextConvert(this.#repository)

        // タスク一覧の取得
        const tasks = await this.#repository.getTasks()

        for (let task of tasks) {
            // ボットインスタンス作成
            const bot = BotProviderFactory.createBot(task.type, {
                slack: {
                    token: task.options.slack.token,
                    channelId: task.options.slack.channelId,
                    userName: task.options.slack.userName,
                    iconUrl: task.options.slack.iconUrl
                },
                debug: {
                    userName: task.options.debug.userName
                }
            })

            // タスクランナーインスタンス作成
            const taskRunner = new TaskRunner(bot, textConverter)
            for (let schedule of task.schedules) {
                const convertTexts = schedule.texts
                // スケジューラに入力
                taskRunner.add(schedule.cron, convertTexts, schedule.mode)
            }
            
            taskRunner.run()
        }

    }
}

module.exports = NotificationService
