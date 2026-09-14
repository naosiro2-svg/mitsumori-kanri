# 顧客・見積り管理システム

顧客データの蓄積・検索と、過去の見積りデータを活用した見積り書作成を行うWebアプリです。
React + Vite + TypeScript + Tailwind CSS + Google Identity Services（Googleログイン）+ Google Sheets API / Drive API で構成されています。

データの保存先は**Googleスプレッドシートそのもの**です。バックエンドサーバーやFirebaseは使わず、ブラウザから直接GoogleのOAuth認証（Google Identity Services）でアクセストークンを取得し、Sheets/Drive APIを呼び出します。

## できること

- 顧客データ（会社名・担当者・連絡先・住所・備考）の登録・検索・編集・削除
- 見積り書の作成（品目・数量・単価から自動計算、消費税対応）
- 顧客ごとの過去の見積り履歴を参照し、明細をそのままコピーして新しい見積りを作成
- Googleスプレッドシートへの自動保存・同期（未接続時はブラウザにローカル保存）

## セットアップ

### 1. Google CloudでOAuthクライアントIDを発行

1. https://console.cloud.google.com/ で新規プロジェクトを作成（または既存プロジェクトを選択）
2. 「APIとサービス」>「ライブラリ」で [Google Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com) と [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com) を有効化
3. 「APIとサービス」>「OAuth同意画面」を設定（テスト中は「外部」+ テストユーザーに自分のGoogleアカウントを追加すればOK）
4. 「APIとサービス」>「認証情報」>「認証情報を作成」>「OAuthクライアントID」
   - アプリケーションの種類: **ウェブアプリケーション**
   - 承認済みのJavaScript生成元に `http://localhost:3000` を追加（本番公開する場合はそのURLも追加）
5. 発行された**クライアントID**を控える

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` の `VITE_GOOGLE_CLIENT_ID` に、控えたクライアントIDを貼り付けてください。

### 3. インストールと起動

```bash
npm install
npm run dev
```

http://localhost:3000 でアプリが起動します。

### 4. 使い方

1. 右上の「Google連携」でログイン
2. 初回ログイン時にスプレッドシート接続画面が開くので、「専用スプレッドシートを新規作成して接続」を選択
3. 「顧客管理」タブで顧客を登録
4. 「見積り作成」タブで見積り書を作成（既存顧客を選ぶと、右側にその顧客の過去の見積りが表示され、明細をコピーして再利用できます）

## データ構造（自動生成されるスプレッドシート）

- **顧客データ**シート: 顧客ID, 会社名, 担当者名, 電話番号, メールアドレス, 住所, 備考, 登録日時
- **見積り明細データ**シート: 見積り番号, 顧客ID, 顧客名, 発行日, 有効期限, 明細番号, 品目名, 数量, 単位, 単価, 金額, 小計, 消費税額, 合計金額, 備考, 登録日時, 見積りID
