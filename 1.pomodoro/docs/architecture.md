# アーキテクチャ概要

## 全体構成

Pomodoro Timer は Flask + HTML/CSS/JavaScript で実装された Web アプリケーションです。
タイマーのロジックとUI制御はすべてフロントエンドで完結し、Flask はページ配信のみを担当します。

```
クライアント（ブラウザ）
├── static/js/timer-core.js  ← 純粋ロジック（DOM非依存）
├── static/js/app.js         ← UI制御・イベント処理・描画
└── static/css/style.css     ← スタイル定義

サーバ（Flask）
├── app.py                   ← アプリケーションファクトリ
└── templates/index.html     ← HTMLテンプレート
```

---

## Flask 層

### `app.py`

- `create_app(test_config=None)` のアプリケーションファクトリ構成を採用
- `test_config` を渡すことでテスト時の設定を差し替え可能
- 定義されているルートは `GET /` のみ（`index.html` を返す）

```python
def create_app(test_config=None):
    app = Flask(__name__)
    if test_config is not None:
        app.config.update(test_config)

    @app.route("/")
    def index():
        return render_template("index.html")

    return app
```

**現在のバックエンドには REST API エンドポイント（`/api/config` など）は実装されていません。**

---

## フロントエンド層

### `static/js/timer-core.js` — 純粋ロジック

- IIFE (`TimerCore`) として定義されたモジュール
- DOM・API通信・副作用を含まない純粋関数群で構成
- Node.js 環境（テスト）でも `require()` で利用可能

### `static/js/app.js` — UI 制御

- `TimerCore` を利用してタイマーを制御する UI スクリプト
- `setInterval` / `clearInterval` によるカウントダウン管理
- ボタンイベント・設定フォームのイベント処理
- DOM 更新（タイマー表示・フェーズラベル・セット数・ボタン状態）

### `templates/index.html` — HTML テンプレート

- フェーズ表示、セット数、タイマー表示、操作ボタン、設定フォームを含む単一ページ
- `timer-core.js` を先行ロード、`app.js` を `defer` で読み込む

### `static/css/style.css` — スタイル定義

- CSS カスタムプロパティ（変数）でカラーテーマを管理
- BEM に近い命名規則（`.block__element--modifier`）
- `@media (max-width: 480px)` によるレスポンシブ対応

---

## 状態管理

タイマーの状態は `TimerCore` が管理するイミュータブルなオブジェクトで表現されます。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `phase` | `"focus" \| "short_break" \| "long_break"` | 現在のフェーズ |
| `activeSet` | `number` | 現在のセット番号（1 始まり） |
| `hasStarted` | `boolean` | セッションを開始済みかどうか |
| `isRunning` | `boolean` | カウントダウン中かどうか |
| `remainingSeconds` | `number` | 現在のフェーズの残り秒数 |
| `settings` | `object` | タイマー設定（分単位） |

状態遷移は `start`・`pause`・`tick`・`reset`・`skip`・`nextPhase` の各関数を通じて行われます。

---

## テスト構成

| ファイル | フレームワーク | 対象 |
|---------|--------------|------|
| `tests/test_app.py` | pytest | Flask ルート・静的ファイル配信・`create_app` |
| `tests/timer-core.test.js` | Jest | `TimerCore` の全関数 |
