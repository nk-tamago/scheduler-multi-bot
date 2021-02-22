# scheduler-multi-bot
slackなどへ指定した日時に投稿するタスクスケジューラーです<br>
REST APIでスケジュールの登録、編集、削除することが出来ます

# Install
```sh
$ npm install
```
## Requirement
scheduler-multi-bot requires the following to run:

  * [Node.js][node] 12.0+
  * [npm][npm] (normally comes with Node.js)

# Usage
node index.js [configfile]

## configfileについて
- `repository.type` は現在 `json`と`nedb` (推奨)のみ対応しています
- `json` の場合は `repository.options.json.path` に下記で説明する保存先json-repositoryファイルを指定してください
  - 起動後にWebAPIで登録する場合は 空( `[]` )でも問題ありません
- `nedb` の場合は `repository.options.nedb.path` に保存先のdatabaseファイルを指定してください
  - 初回起動時はdatabaseファイルが新規作成されます
```json
{
  "repository": {
    "type": "nedb",
    "options": {
      "json": {
        "path": "./repository-example.json"
      },
      "nedb": {
        "path": "./repository-example.db"
      }
    }
  }
}
```
## json-repositoryファイル
- `repository.type` が `json` の時のみ有効となります
- WebAPIにて更新されますが、以下のルールで手動で作成することも出来ます
- `tasks.name` は必須一意となる名前を指定してください
- `tasks.bot.type` は現在 `slack` or `teams` or `debug` が指定できます。`debug` を指定するとコンソールに表示します
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
        "teams": {
          "webhook": "https://*****"
        },
        "debug": {
          "userName": "テストユーザ"
        }
      }
    }
    ```
- `tasks.schedules.mode` は `sequence` or `random` が指定できます
  - `sequence` を指定すると `texts` または `overrideObjects` を順番にpushします
  - `random` を指定すると `texts` または `overrideObjects` をランダムにpushします
- `tasks.schedules.cron` は cron式を指定します
- `tasks.schedules.texts` は単純なテキストを投稿したい時に指定します
- `tasks.schedules.overrideObjects` は引用など複雑な情報を投稿したい時に指定します
  - Slackの場合は以下リンクのArgumentsを直接指定できます
    - https://api.slack.com/methods/chat.postMessage
    - 以下はデフォルト指定されているので入力不要です。入力した場合はデフォルトを上書きします
      - token
      - channel
      - icon_url
      - username
    - 設定例
      - ```json
        "overrideObjects": [
          {
            "text": "引用例です",
            "attachments": [{
              "title": "タイトル",
              "text": "引用メッセージ"
            }]
          }
        ]
        ```
  - Teamsの場合は以下リンクの項目を直接指定できます
    - https://docs.microsoft.com/ja-jp/outlook/actionable-messages/message-card-reference
- `texts` と `overrideObjects` 両方に値が設定されている場合は `overrideObjects` が優先されます
- `tasks.schedules.texts` , `overrideObjects` には変数を指定することが出来ます。変数には静的変数と動的変数が指定できます
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
      "name": "example",
      "bot" : {
        "type": "slack",
        "options": {
          "slack": {
            "channelId": "xxxxxxx",
            "token": "xxxxx-xxxxxxx-xxxxxxxx-xxxxxxxx",
            "userName": "テストユーザ",
            "iconUrl": "https://****.png"
          },
          "teams": {
            "webhook": "https://*****"
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
          ],
          "overrideObjects": [
            {
              "text": "優先テキストです",
              "attachments": [{
                "title": "タイトルです",
                "text": "今の時間：${getNowTime}"
              }]
            },
            {
              "text": "優先テキストです",
              "attachments": [{
                "title": "タイトルです",
                "text": "今の時間：${getNowTime}"
              }]
            }
          ],
        },
        {
          "mode": "random",
          "cron": "*/1 * * * 1,2,3,4,5",
          "texts": [
            "ランダム ${test} です",
            "ランダム ${test2} です"
          ],
          "overrideObjects": []
        }
      ]
    }
  ]
}

```
# REST API
REST APIを使用してスケジュールの登録、編集、削除が出来ます

| URL | Method | Query Params | Body | Result | Description |
| - | - | - | - | - | - |
| /status | GET | - | - | JSON | 登録されているタスクと状態を取得します |
| /status/:name | GET | - | - | JSON | 指定されたタスクの状態を取得します |
| /tasks | GET | - | - | JSON | 登録されているタスクを取得します |
| /tasks/:name | GET | - | - | JSON | 指定されたタスクを取得します |
| /tasks/:name/start | GET | - | - | - | 指定されたタスクを開始します |
| /tasks/:name/stop | GET | - | - | - | 指定されたタスクを停止します |
| /tasks | POST | - | JSON | - | タスクを新規登録します |
| /tasks/:name | PUT | - | JSON | - | 指定されたタスクを更新します |
| /tasks/:name | DELETE | - | - | - | 指定されたタスクを削除します |
| /logs/:date | GET | limit=[1-1000]<br>order=["desc","asc"]<br>level=[※1]| - | JSON | 指定された年月日[YYYYMMDD]でログを取得します<br>(※1)level=["error","warn","info","http","verbose","debug","silly"]|
| /export | GET | - | - | JSON | 登録されているタスクをimport出来る形式で取得します |
| /import | POST | - | JSON | JSON | exportで取得されたデータに差し替えます |
<br>

## Body Example

- [POST, PUT] /tasks
  - 上記の json-repositoryファイル のtasks内と同じフォーマットです
  - ```JSON
    {
      "name": "example",
      "bot": {
        "type": "slack",
        "options": {
          "slack": {
            "channelId": "",
            "token": "",
            "userName": "template user",
            "iconUrl": "https://example/example.png"
          },
          "teams": {
            "webhook": "https://*****"
          },
          "debug": {
            "userName": "template user"
          }
        }
      },
      "variables": [
        {
          "type": "static",
          "key": "template1",
          "value": "temp1"
        },
        {
          "type": "dynamic",
          "key": "template2",
          "value": "return 'temp2'"
        }
      ],
      "schedules": [
        {
          "mode": "sequence",
          "cron": "*/1 * * * 1,2,3,4,5,6,7",
          "texts": [
            "sequence push ：${template1}",
            "sequence push ：${template2}",
            "sequence push ：temp3"
          ],
          "overrideObjects": [
            {
              "text": "sequence push ：${template1}",
              "attachments": [{
                "title": "template1",
                "text": "${template1}"
              }]
            },
            {
              "text": "sequence push ：${template2}",
              "attachments": [{
                "title": "template2",
                "text": "${template2}"
              }]
            }
          ],
        },
        {
          "mode": "random",
          "cron": "*/1 * * * 1,2,3,4,5,6,7",
          "texts": [
            "random push ：${template1}",
            "random push ：${template2}",
            "random push ：temp3"
          ],
          "overrideObjects": []
        }
      ]
    }
    ```
- [POST] /import
  - 上記の json-repositoryファイル と同じフォーマットです

<br>


# Example
```sh
$ node .\index.js .\config-example.json
```
