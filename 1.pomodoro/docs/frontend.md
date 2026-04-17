# フロントエンド モジュールドキュメント

## ファイル構成

```
static/
├── js/
│   ├── timer-core.js   # 純粋ロジックモジュール（DOM非依存）
│   └── app.js          # UI制御スクリプト
└── css/
    └── style.css       # スタイル定義

templates/
└── index.html          # シングルページ HTML テンプレート
```

---

## `timer-core.js` — 純粋ロジックモジュール

### 概要

タイマーのコアロジックを IIFE `TimerCore` としてカプセル化したモジュールです。
DOM・`setInterval`・API通信などの副作用を一切含まず、純粋関数のみで構成されています。
ブラウザでは `<script>` タグで読み込み、テスト（Jest）では `require()` で利用します。

### 公開 API

#### `TimerCore.defaultSettings()`

デフォルトのタイマー設定を返します。

```js
TimerCore.defaultSettings()
// => { focus_minutes: 25, short_break_minutes: 5, long_break_minutes: 15, long_break_interval: 4 }
```

#### `TimerCore.createInitialState(settings)`

指定した設定で初期タイマー状態を生成します。

```js
const state = TimerCore.createInitialState(TimerCore.defaultSettings());
// => { phase: "focus", activeSet: 1, hasStarted: false, isRunning: false, remainingSeconds: 1500, settings: {...} }
```

#### `TimerCore.getPhaseDuration(phase, settings)`

指定フェーズの継続時間を秒単位で返します。

```js
TimerCore.getPhaseDuration("focus", settings)        // => 1500 (25分)
TimerCore.getPhaseDuration("short_break", settings)  // => 300  (5分)
TimerCore.getPhaseDuration("long_break", settings)   // => 900  (15分)
```

#### `TimerCore.formatTime(totalSeconds)`

秒数を `MM:SS` 形式の文字列に変換します。

```js
TimerCore.formatTime(1500) // => "25:00"
TimerCore.formatTime(61)   // => "01:01"
TimerCore.formatTime(0)    // => "00:00"
```

#### `TimerCore.phaseLabel(phase)`

フェーズキーを日本語ラベルに変換します。未知のキーはそのまま返します。

```js
TimerCore.phaseLabel("focus")       // => "集中"
TimerCore.phaseLabel("short_break") // => "短休憩"
TimerCore.phaseLabel("long_break")  // => "長休憩"
```

#### `TimerCore.start(state)`

タイマーを開始します。既に実行中の場合は状態を変更せず同じオブジェクトを返します。

```js
const next = TimerCore.start(state);
// next.isRunning === true, next.hasStarted === true
```

#### `TimerCore.pause(state)`

タイマーを一時停止します。既に停止中の場合は状態を変更せず同じオブジェクトを返します。

```js
const next = TimerCore.pause(state);
// next.isRunning === false
```

#### `TimerCore.tick(state)`

1 秒経過を処理します。`isRunning === false` の場合は何もしません。
`remainingSeconds` が 0 の場合は自動的に次のフェーズへ進みます（`isRunning` は維持）。

```js
const next = TimerCore.tick(state);
// next.remainingSeconds === state.remainingSeconds - 1 (残り > 0 の場合)
```

#### `TimerCore.reset(state, settings?)`

タイマーを初期状態にリセットします。`settings` を渡すと新しい設定で初期化されます。

```js
const next = TimerCore.reset(state);
// next.phase === "focus", next.activeSet === 1, next.hasStarted === false

const nextWithNewSettings = TimerCore.reset(state, newSettings);
```

#### `TimerCore.skip(state)`

現在のフェーズをスキップして次のフェーズに進みます。タイマーは停止状態になります（`isRunning === false`）。

```js
const next = TimerCore.skip(state);
// next.isRunning === false, next.phase === <次のフェーズ>
```

#### `TimerCore.nextPhase(state)`

現在のフェーズを完了し、次のフェーズへ遷移した新しい状態を返します。
`tick` 内でフェーズタイムアウト時に呼び出されます。

```js
// focus (セット 1) → short_break
// focus (セット 4) → long_break  (long_break_interval === 4 の場合)
// short_break / long_break → focus (セット番号インクリメント)
```

---

## `app.js` — UI 制御スクリプト

### 概要

`TimerCore` を使ってタイマーを制御し、DOM を更新する UI スクリプトです。
`timer-core.js` の後に読み込まれます。

### 内部状態

| 変数 | 説明 |
|------|------|
| `state` | 現在のタイマー状態（`TimerCore` のイミュータブルオブジェクト） |
| `timerId` | `setInterval` の ID。`null` はタイマー未起動を示す |

### 主要な関数

| 関数 | 説明 |
|------|------|
| `readSettings()` | フォーム要素から設定を読み取り、`TimerSettings` オブジェクトを返す |
| `readNumber(id, fallback)` | 指定 ID の `<input>` 値を整数として読み取る。不正値は `fallback` を使用 |
| `render()` | 現在の `state` を DOM に反映する |
| `startTimer()` | タイマーを開始し、`setInterval` を登録する |
| `pauseOrResumeTimer()` | 実行中なら一時停止、停止中なら再開する |
| `resetTimer()` | インターバルを解除してタイマーをリセットする |
| `skipPhase()` | インターバルを解除して次のフェーズにスキップする |
| `onTick()` | 1 秒ごとに呼ばれる `tick` 処理と再描画 |

### イベントハンドラ

| 要素 ID | イベント | 処理 |
|---------|---------|------|
| `btn-start` | `click` | `startTimer()` |
| `btn-pause` | `click` | `pauseOrResumeTimer()` |
| `btn-reset` | `click` | `resetTimer()` |
| `btn-skip` | `click` | `skipPhase()` |
| `settings-form` | `submit` | `event.preventDefault()` → `resetTimer()` |

### ボタン状態の制御

`render()` 内でボタンの `disabled` 状態が以下のように制御されます。

| ボタン | `disabled` になる条件 |
|--------|---------------------|
| `btn-start` | `state.isRunning === true` または `state.hasStarted === true` |
| `btn-pause` | `state.hasStarted === false` |

`btn-pause` のテキストは `state.isRunning` が `true` なら `"一時停止"`、`false` なら `"再開"` になります。

---

## `templates/index.html` — HTML テンプレート

### 構成要素

| 要素 ID | タグ | 役割 |
|---------|-----|------|
| `phase-label` | `<span>` | 現在のフェーズ名を表示（例: 集中） |
| `set-count` | `<span>` | セット進捗を表示（例: セット 1 / 4） |
| `timer-display` | `<span>` | 残り時間を MM:SS 形式で表示 |
| `btn-start` | `<button>` | タイマー開始ボタン |
| `btn-pause` | `<button>` | 一時停止 / 再開ボタン |
| `btn-reset` | `<button>` | リセットボタン |
| `btn-skip` | `<button>` | スキップボタン |
| `settings-form` | `<form>` | タイマー設定フォーム |
| `focus-minutes` | `<input type="number">` | 集中時間（分）入力 |
| `short-break-minutes` | `<input type="number">` | 短休憩時間（分）入力 |
| `long-break-minutes` | `<input type="number">` | 長休憩時間（分）入力 |
| `long-break-interval` | `<input type="number">` | 長休憩間隔（セット数）入力 |

---

## `static/css/style.css` — スタイル定義

### CSS カスタムプロパティ（変数）

| 変数名 | 値 | 用途 |
|-------|-----|------|
| `--color-focus` | `#e74c3c` | 集中フェーズのアクセントカラー（赤） |
| `--color-short-break` | `#27ae60` | 短休憩フェーズのカラー（緑）※現在未使用 |
| `--color-long-break` | `#2980b9` | 長休憩フェーズのカラー（青）※現在未使用 |
| `--color-bg` | `#fafafa` | 背景色 |
| `--color-surface` | `#ffffff` | カード・パネルの背景色 |
| `--color-text` | `#2c3e50` | 本文テキストカラー |
| `--color-muted` | `#7f8c8d` | 補足テキストカラー |
| `--color-border` | `#dfe6e9` | ボーダーカラー |
| `--font-mono` | `'Courier New', Courier, monospace` | タイマー表示フォント |

### ボタンバリアント

| クラス | 説明 |
|--------|------|
| `.btn--primary` | 赤（`--color-focus`）の塗りつぶしボタン |
| `.btn--secondary` | グレーの塗りつぶしボタン |
| `.btn--ghost` | 透明背景・ボーダー付きボタン |

### レスポンシブ対応

`@media (max-width: 480px)` で以下が変更されます。

- `.app` のパディング縮小（`1.5rem` → `1rem`）
- タイマー円の直径縮小（`220px` → `180px`）
- タイマー数字のフォントサイズ縮小（`3.5rem` → `2.8rem`）
