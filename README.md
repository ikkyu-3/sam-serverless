# sam-serverless

[hr-js/sta_access_manager](https://github.com/hr-js/sta_access_manager)のサーバ側を、サーバレスアプリケーションで開発する。

## 使用するクラウドサービス

- AWS

## 使用するAWSのサービス

- Amazon API Gateway
- AWS Lambda ... Node.js 8.10
- Amazon DynamoDB

## その他に使用するツール

- [serverless](https://serverless.com/)
- [jest](https://jestjs.io/)
- [TSlint](https://palantir.github.io/tslint/)
- [Prettier](https://prettier.io/)

## やりたいこと

### AWS Lambda

- TypeScriptの使用
- AWS Lambda Layersを使用

## その他

- 変更が発生したらREADME.mdを更新していきます。
- 基本ブランチは分けずにコミットする。開発後はブランチを分ける考えでいます。

## 準備

### .env作成

```.env
E2E_TEST_SERVER= # テストサーバ
SAM_API_URL= # APIのURL
REGION= # リージョン
FROM_MAIL_ADDRESS= # 送信者のメールアドレス
TO_MAIL_ADDRESS= # 受信者のメールアドレス
```