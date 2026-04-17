# データモデル仕様

Pomodoro Timer のデータ構造は、フロントエンドの `TimerCore` モジュール内で定義・管理されます。
サーバサイドにはデータベースや永続化レイヤーは現時点で存在しません。

---

## タイマー状態 (TimerState)

`TimerCore.createInitialState(settings)` が返す状態オブジェクトです。
各関数（`start`、`pause`、`tick`、`reset`、`skip`）はこのオブジェクトを受け取り、新しい状態オブジェクトを返します（イミュータブル）。

```js
{
  phase: "focus",          // 現在のフェーズ
  activeSet: 1,            // 現在のセット番号
  hasStarted: false,       // セッション開始済みかどうか
  isRunning: false,        // カウントダウン中かどうか
  remainingSeconds: 1500,  // 残り秒数
  settings: { ... }        // タイマー設定
}
```

### フィールド詳細

| フィールド | 型 | 取りうる値 | 説明 |
|-----------|-----|-----------|------|
| `phase` | `string` | `"focus"`, `"short_break"`, `"long_break"` | 現在のタイマーフェーズ |
| `activeSet` | `number` | `1` 以上の整数 | 現在何セット目かを示す。`long_break` 後は `1` に戻る |
| `hasStarted` | `boolean` | `true` / `false` | 一度でも開始ボタンが押されたかどうか |
| `isRunning` | `boolean` | `true` / `false` | 現在カウントダウン中かどうか |
| `remainingSeconds` | `number` | `0` 以上の整数 | 現在のフェーズの残り秒数 |
| `settings` | `object` | — | タイマー設定オブジェクト（下記参照） |

---

## タイマー設定 (TimerSettings)

タイマーの動作を制御する設定オブジェクトです。
HTML フォームの入力値から構築され、`TimerCore.defaultSettings()` がデフォルト値を返します。

```js
{
  focus_minutes: 25,        // 集中時間（分）
  short_break_minutes: 5,   // 短休憩時間（分）
  long_break_minutes: 15,   // 長休憩時間（分）
  long_break_interval: 4    // 長休憩を挟むセット数
}
```

### フィールド詳細

| フィールド | 型 | デフォルト値 | HTML 入力制限 | 説明 |
|-----------|-----|------------|-------------|------|
| `focus_minutes` | `number` | `25` | `min=1, max=60` | 集中フェーズの時間（分） |
| `short_break_minutes` | `number` | `5` | `min=1, max=30` | 短休憩フェーズの時間（分） |
| `long_break_minutes` | `number` | `15` | `min=1, max=60` | 長休憩フェーズの時間（分） |
| `long_break_interval` | `number` | `4` | `min=1, max=10` | この回数だけ集中を完了すると長休憩になる |

---

## フェーズ遷移

フェーズは以下のルールで遷移します。

```
focus (セット n)
  ├─ n % long_break_interval === 0 の場合 → long_break
  └─ それ以外 → short_break

short_break または long_break
  └─ → focus (セット n+1、ただし long_break_interval で折り返し)
```

### セット番号の計算

`short_break` または `long_break` が終了して次の `focus` に移るとき、セット番号は以下の式で計算されます。

```js
nextSet = (activeSet % long_break_interval) + 1
```

例（`long_break_interval = 4` の場合）：

| 完了したセット (`activeSet`) | 次のセット番号 |
|---------------------------|-------------|
| 1 | 2 |
| 2 | 3 |
| 3 | 4 |
| 4 | 1（折り返し） |

---

## フェーズラベル

`TimerCore.phaseLabel(phase)` が返す日本語ラベルです。

| `phase` 値 | 表示ラベル |
|-----------|----------|
| `"focus"` | `集中` |
| `"short_break"` | `短休憩` |
| `"long_break"` | `長休憩` |
| 上記以外 | `phase` の値をそのまま返す |
