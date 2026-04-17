# API リファレンス

## 概要

Pomodoro Timer の Flask バックエンドが提供する HTTP エンドポイントの一覧です。

現時点では画面配信エンドポイント 1 件のみが実装されています。

---

## エンドポイント一覧

### `GET /`

トップページ（タイマー画面）を返します。

#### リクエスト

```
GET / HTTP/1.1
```

パラメータなし。

#### レスポンス

| ステータスコード | Content-Type | 説明 |
|-----------------|--------------|------|
| `200 OK` | `text/html` | `templates/index.html` をレンダリングして返す |

#### レスポンス例

```html
<!DOCTYPE html>
<html lang="ja">
  ...
  <div id="timer-display">25:00</div>
  ...
</html>
```

---

## 静的ファイル配信

Flask の組み込み静的ファイル配信機能により、以下のパスでファイルを取得できます。

| パス | ファイル | 説明 |
|------|---------|------|
| `GET /static/css/style.css` | `static/css/style.css` | スタイルシート |
| `GET /static/js/timer-core.js` | `static/js/timer-core.js` | タイマーコアロジック |
| `GET /static/js/app.js` | `static/js/app.js` | UI 制御スクリプト |

---

## 未実装エンドポイント（設計のみ）

以下は `architecture.md` に記載された将来実装予定のエンドポイントです。**現在のコードには含まれていません。**

| エンドポイント | 説明 |
|--------------|------|
| `GET /api/config` | タイマー設定の取得 |
| `POST /api/config` | タイマー設定の保存 |
| `POST /api/sessions` | セッション完了の記録 |
