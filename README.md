# scheduler-multi-bot
slackなどへ指定した日時に投稿するタスクスケジューラーです

# Install
```sh
$ npm install
```

# Usage
node index.js [configfile]

## configfileについて
- `repository.type` は現在 `json` のみ対応しています
- `repository.options.path` は下記で説明するrepositoryファイルを指定してください
```json
{
  "repository": {
    "type": "json",
    "options": {
      "path": "./repository-example.json"
    }
  }
}
```
## repositoryファイル
- `tasks.bot.type` は現在 `slack` or `debug` が指定できます。`debug` を指定するとコンソールに表示します
  - `tasks.bot.options` は `tasks.bot.type` によって設定する内容が異なります
  - ```json
    {
      "options" :{
        "slack": {
          "channelId": "xxxxxxx",
          "token": "xxxxx-xxxxxxx-xxxxxxxx-xxxxxxxx",
          "userName": "テストユーザ",
          "iconUrl": "https://****.png"
        },
        "debug": {
          "userName": "テストユーザ"
        }
      }
    }
    ```
- `tasks.schedules.mode` は `sequence` or `random` が指定できます
  - `sequence` を指定すると `texts` を順番にpushします
  - `random` を指定すると `texts` をランダムにpushします
- `tasks.schedules.cron` は cron式を指定します
- `tasks.schedules.texts` には変数を指定することが出来ます。変数には静的変数と動的変数が指定できます
  - `tasks.variables.type` == `static` が静的変数です
    - 固定値で置換します
    - `${xxxx}` の `xxxx` と同じ項目で `key` を指定してください 
  - `tasks.variables.type` == `dynamic` が動的変数です
    - 式の結果で置換します(例：`"return (new Date()).getTime()"`)
    - `${xxxx}` の `xxxx` と同じ項目で `key` を指定してください
  - `static` と `dynamic` で同じ変数となった場合は、先に登録した変数が優先されます
- `tasks` は複数指定できます。異なるpush先を指定などが可能です

```json
{
  "tasks": [
    {
      "bot" : {
        "type": "slack",
        "options": {
          "slack": {
            "channelId": "xxxxxxx",
            "token": "xxxxx-xxxxxxx-xxxxxxxx-xxxxxxxx",
            "userName": "テストユーザ",
            "iconUrl": "https://****.png"
          },
          "debug": {
            "userName": "テストユーザ"
          }
        }
      },
      "variables": [
        { "type": "static", "key": "test", "value": "テスト" },
        { "type": "static", "key": "test2", "value": "テスト2" },
        { "type": "dynamic", "key": "getNowTime", "value": "return (new Date()).getTime()" }
      ],
      "schedules": [
        {
          "mode": "sequence",
          "cron": "*/1 * * * 1,2,3,4,5",
          "texts": [
            "シーケンス ${test} です",
            "シーケンス ${test2} です",
            "現在時刻は ${getNowTime} です"
          ]
        },
        {
          "mode": "random",
          "cron": "*/1 * * * 1,2,3,4,5",
          "texts": [
            "ランダム ${test} です",
            "ランダム ${test2} です"
          ]
        }
      ]
    }
  ]
}

```

## Example
```sh
$ node .\index.js .\config-example.json
```
