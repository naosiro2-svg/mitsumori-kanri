# 顧客・見積り管理システム

顧客データの蓄積・検索と、過去の見積りデータを活用した見積り書作成を行うWebアプリです。
React + Vite + TypeScript + Tailwind CSS + Firebase（Googleログイン）+ Google Sheets API / Drive API で構成されています。

データの保存先はFirestoreではなく、**Googleスプレッドシートそのもの**です。Firebaseは「Googleでログイン」してSheets/Drive APIを呼び出すためのOAuthトークンを取得する窓口としてのみ使われます。

## できること

- 顧客データ（会社名・担当者・連絡先・住所・備考）の登録・検索・編集・削除
- 見積り書の作成（品目・数量・単価から自動計算、消費税対応）
- 顧客ごとの過去の見積り履歴を参照し、明細をそのままコピーして新しい見積りを作成
- Googleスプレッドシートへの自動保存・同期（未接続時はブラウザにローカル保存）

## セットアップ

### 1. Firebaseプロジェクトを作成

1. https://console.firebase.google.com/ で新規プロジェクトを作成
2. 「Authentication」>「Sign-in method」で **Google** を有効化
3. 同じGoogle CloudプロジェクトでAPIを有効化: [Google Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com) と [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)
4. Firebaseの「プロジェクトの設定」>「マイアプリ」でWebアプリを追加し、表示される設定値を控える

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` に、Firebaseの設定値を貼り付けてください。

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
