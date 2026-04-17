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
  architecture.md
  README.md
  1.pomodoro/
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

- state + action + now を受け取り nextState を返す reducer 方式
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

主要状態:

- `idle`
- `focus_running`
- `short_break_running`
- `long_break_running`
- `paused`
- `completed`

代表遷移:

- `idle -> focus_running`（開始）
- `focus_running -> paused`（一時停止）
- `paused -> focus_running`（再開）
- `focus_running -> short_break_running`（作業完了）
- 規定セット数ごとに `short_break_running` の代わりに `long_break_running`
- `break_running -> focus_running`（休憩完了後に次セット）

## 7. タイマー精度方針

- カウント値の減算ではなく、終了予定時刻との差分で残時間を算出
- `setInterval` は表示更新トリガーとして利用
- 真実の時間は `now`（Clock）で判定

この方式で、タブ非アクティブ復帰時のズレを最小化します。

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
