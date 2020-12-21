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
        // データロード
        await this.#repository.load()

        // 変数一覧の取得
        const variables = await this.#repository.getVariables()

        // コンバータに変数を入力
        const textConverter = new TextConverter()
        variables.forEach((variable) => {
            textConverter.addVariable(variable.key, variable.value)
        })

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
            const taskRunner = new TaskRunner(bot)
            for (let schedule of task.schedules) {
                // 表示文字列を変数に変換
                let convertTexts = schedule.texts.map((text) => {
                    return textConverter.convert(text)
                })
                // スケジューラに入力
                taskRunner.add(schedule.cron, convertTexts, schedule.mode)
            }
            
            taskRunner.run()
        }

    }
}

module.exports = NotificationService
