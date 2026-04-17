# Pomodoro Timer Webアプリケーション アーキテクチャ案

## 1. 目的

本ドキュメントは、Flask + HTML/CSS/JavaScriptで実装するPomodoro Timer Webアプリのアーキテクチャ方針をまとめたものです。

設計目標は以下の3点です。

- UIモック準拠で実装しやすいこと
- タイマーの精度と安定性を確保すること
- ユニットテストしやすく、将来拡張しやすいこと

## 2. 全体方針

- サーバはFlaskで画面配信と最小APIを担当
- タイマー制御はフロントエンド中心で実行
- ロジックを純粋関数化し、副作用を分離する

この方針により、MVPを短期間で作りつつ、機能追加時の変更コストを抑えます。

## 3. 想定ディレクトリ構成

```text
/workspaces/worshop/
  README.md
  1.pomodoro/
    architecture.md
    app.py
    templates/
      index.html
    static/
      css/
        style.css
      js/
        timer-core.js
        timer-service.js
        ui-controller.js
        ui-renderer.js
        storage.js
        api-client.js
      assets/
```

## 4. レイヤ構成と責務

### 4.1 Flask層

- 画面ルーティング: `GET /`
- 設定取得: `GET /api/config`
- 設定更新: `POST /api/config`
- 将来拡張: `POST /api/sessions`（1セッション完了記録）

原則として、サーバは「設定・永続化・配信」に責務を限定します。

### 4.2 フロントエンド層

- HTML/CSS: モック準拠のUI構築、レスポンシブ対応
- JavaScript: 状態遷移、残時間計算、イベント処理
- Local Storage: 設定・進捗の軽量保存

## 5. フロントエンド内部アーキテクチャ（テスト容易性重視）

### 5.1 timer-core.js（純粋ロジック）

- state を受け取り新しい state を返す関数群で構成
- DOM操作、API通信、通知処理を含めない
- 集中/休憩サイクル、残時間、遷移可否をここに集約

### 5.2 timer-service.js（ユースケース層）

- coreロジックを呼び出し、実行フローを管理
- Clock/Storage/Notifier/ApiClientを注入して副作用を実行
- UI層には state 変更結果のみを通知

### 5.3 ui-controller.js（入力制御）

- ボタンやフォームイベントを action に変換
- ビジネスロジックは持たない

### 5.4 ui-renderer.js（描画専用）

- state を受け取り、UI表示を反映
- 「このstateならこの表示」という単純な責務に限定

### 5.5 副作用アダプタ

- storage.js: localStorageアクセス
- api-client.js: Flask API通信
- notifier（必要に応じて追加）: 音/通知

## 6. 状態機械（State Machine）

実装上の状態は、単一のstate enumではなく、以下の組み合わせで表現します。

- `phase`: `focus | short_break | long_break`
- `hasStarted`: セッション開始済みかどうか
- `isRunning`: 現在カウントダウン中かどうか

代表的な状態の読み替え:

- 初期状態: `hasStarted = false`（実質的な `idle`）
- 作業中: `phase = focus` かつ `hasStarted = true` かつ `isRunning = true`
- 作業一時停止中: `phase = focus` かつ `hasStarted = true` かつ `isRunning = false`
- 短休憩中: `phase = short_break` かつ `isRunning = true`
- 長休憩中: `phase = long_break` かつ `isRunning = true`
- 休憩一時停止中: `phase = short_break | long_break` かつ `hasStarted = true` かつ `isRunning = false`

補足:

- `paused` は独立した単一状態ではなく、「現在の `phase` を維持したまま `isRunning = false`」で表現します。
- `completed` も独立状態としては持たず、ある `phase` の満了を契機に次の `phase` へ遷移します。

代表遷移:

- 初期状態 `hasStarted = false` から開始すると、`phase = focus, hasStarted = true, isRunning = true`
- 実行中に一時停止すると、`phase` は維持したまま `isRunning = false`
- 一時停止から再開すると、同じ `phase` のまま `isRunning = true`
- `phase = focus` の完了時、規定セット数に応じて `phase = short_break` または `phase = long_break` に切り替える
- `phase = short_break | long_break` の完了時、次の `phase = focus` に切り替える

## 7. タイマー精度方針

- 残時間は `remainingSeconds` を 1 秒ごとに減算して管理
- `setInterval` は 1 秒ごとの tick と表示更新に利用
- タブ非アクティブ時などの `setInterval` 遅延により、残時間表示にズレが生じる可能性がある

現状は実装の単純さを優先し、この方式を採用します。高精度化が必要になった場合は、終了予定時刻との差分で残時間を算出する方式への移行を検討します。

## 8. Flask実装方針（テスト対応）

- `create_app(test_config=None)` のApp Factory構成を採用
- ルート定義はBlueprint化可能な形で整理
- テストでは `test_config` で設定を差し替え

## 9. API契約（初期案）

### 9.1 GET /api/config

レスポンス例:

```json
{
  "focus_minutes": 25,
  "short_break_minutes": 5,
  "long_break_minutes": 15,
  "long_break_interval": 4
}
```

### 9.2 POST /api/config

リクエスト例:

```json
{
  "focus_minutes": 25,
  "short_break_minutes": 5,
  "long_break_minutes": 15,
  "long_break_interval": 4
}
```

バリデーション例:

- 0以下は不正
- 上限超過値は不正
- 型不一致は不正

不正入力時は `400` を返します。

## 10. テスト戦略

### 10.1 Core Unit Test（最優先）

対象:

- reducerの遷移
- 残時間計算
- 長休憩切替ロジック
- 無効アクション処理

### 10.2 Adapter Unit Test

対象:

- storage.js
- api-client.js
- notifier（導入時）

### 10.3 Integration Test

対象:

- UIイベント -> action -> state変化 -> 描画
- Flaskエンドポイント（`/`, `/api/config`）

### 10.4 テスト容易化の設計ルール

- Date.now直接呼び出しを避け、Clockを注入
- API/Storage/Notifierはインターフェース越しに利用
- テストデータビルダーでstate生成を共通化

## 11. 実装ステップ（推奨順）

1. Flaskで `GET /` を返す最小画面配信
2. UIモック準拠の静的HTML/CSSを実装
3. `timer-core.js` の状態機械を実装し、単体テスト作成
4. `timer-service.js` で副作用アダプタを接続
5. UIイベント連携（開始/停止/再開/リセット/スキップ）
6. `GET/POST /api/config` を接続
7. 結合テストと微調整（通知、モバイル最適化）

## 12. 将来拡張

- 完了セッション履歴の保存と可視化
- 日次/週次の集中時間レポート
- ユーザー単位の設定保存
- 通知設定（音量、サウンド種類、ブラウザ通知）

---

本アーキテクチャは、MVPを素早く実装しながら、テスト性と拡張性を担保することを重視しています。
