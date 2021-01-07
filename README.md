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
- `repository.options.path` は下記で説明するmessageファイルを指定してください
```json
{
  "repository": {
    "type": "json",
    "options": {
      "path": "./message-example.json"
    }
  }
}
```
## messageファイル
- `tasks.type` は現在 `slack` or `debug` が指定できます。`debug` を指定するとコンソールに表示します
  - `tasks.options` は `tasks.type` によって設定する内容が異なります
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
  - `staticVariableMap`(静的変数)
    - 固定値で置換します
    - `${xxxx}` の `xxxx` と同じ項目で指定してください 
  - `dynamicVariableMap`(動的変数)
    - 式の結果で置換します(例：`"return (new Date()).getTime()"`)
    - `${xxxx}` の `xxxx` と同じ項目で指定してください
    - `staticVariableMap` と同じ変数となった場合は `staticVariableMap` が優先されます
- `tasks` は複数指定できます。異なるpush先を指定などが可能です

```json
{
  "variables": {
    "staticVariableMap": {
      "test": "テスト",
      "test2": "テスト2"
    },
    "dynamicVariableMap": {
      "getNowTime": "return (new Date()).getTime()"
    }
  },
  "tasks": [
    {
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
      },
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
