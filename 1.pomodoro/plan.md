# Pomodoro Timer 段階的実装計画

## Phase 1 — 最小動作確認（Flask + 静的画面）

**目標:** ブラウザでページが開き、静的なUIが確認できる状態

- `app.py` に `create_app()` と `GET /` を実装
- `templates/index.html` にタイマー表示・ボタンの静的HTML作成
- `static/css/style.css` で基本スタイル適用（レスポンシブ含む）

**完了基準:** `flask run` でUIが表示される

---

## Phase 2 — タイマーコアロジック（純粋関数）

**目標:** ブラウザ・Flaskなしで状態遷移が正しく動作することをテストで確認

- `timer-core.js` の状態機械と reducer を実装
  - 状態定義（`idle / focus_running / paused / short_break_running / long_break_running / completed`）
  - 各アクションの遷移ロジック
  - 残時間計算（終了予定時刻との差分方式）
  - 長休憩判定ロジック
- コアロジックの単体テスト作成（features.md #22）

**完了基準:** テストが全パスする

---

## Phase 3 — タイマーをブラウザで動かす（副作用なし）

**目標:** ボタン操作でタイマーが動く最小インタラクション

- `timer-service.js` の基本実装（Clock注入、`setInterval` 管理）
- `ui-controller.js` でボタンイベント → アクション変換
- `ui-renderer.js` で残時間・フェーズ・セット数の表示更新

**完了基準:** 開始・一時停止・再開・リセットがUIで動作する

---

## Phase 4 — 設定API連携

**目標:** Flaskで設定を管理し、フロントと同期する

- `GET /api/config` / `POST /api/config` を実装（バリデーション含む）
- `api-client.js` でAPI通信を実装
- 設定フォームのUIと `ui-controller.js` のフォームイベント処理
- FlaskエンドポイントのAPIテスト作成（features.md #24）

**完了基準:** 設定変更がAPIに保存され、画面に反映される

---

## Phase 5 — LocalStorage永続化

**目標:** リロード後も設定・進捗が維持される

- `storage.js` の実装（設定・セッション進捗の読み書き）
- `timer-service.js` に Storage を注入して起動時に状態復元
- アダプタ単体テスト作成（features.md #23）

**完了基準:** ページリロード後もセット数・設定が維持される

---

## Phase 6 — 通知機能

**目標:** タイマー終了時にユーザーへフィードバックを行う

- Notifier（音またはブラウザ通知）を実装
- `timer-service.js` に Notifier を注入

**完了基準:** 集中/休憩終了時に音または通知が発火する

---

## Phase 7 — 統合テスト・品質仕上げ

**目標:** 全フローが意図通り動き、モバイルでも崩れない

- UIイベント → state変化 → 描画の統合テスト（features.md #24）
- モバイルレイアウト最終調整
- タブ非アクティブ復帰時の精度確認

---

## フェーズ概要表

| Phase | 主な成果物 | 優先度 |
|-------|-----------|--------|
| 1 | Flask最小画面配信 + 静的UI | ★★★ |
| 2 | `timer-core.js` + 単体テスト | ★★★ |
| 3 | タイマー動作（開始/停止/再開/リセット） | ★★★ |
| 4 | 設定API + フォームUI | ★★☆ |
| 5 | LocalStorage永続化 | ★★☆ |
| 6 | 通知機能（音/ブラウザ通知） | ★☆☆ |
| 7 | 統合テスト・仕上げ | ★★☆ |
