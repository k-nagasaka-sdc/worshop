const TimerCore = require("../static/js/timer-core");

const DEFAULT_SETTINGS = TimerCore.defaultSettings();

function makeSettings(overrides) {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

// ============================================================
// formatTime
// ============================================================
describe("formatTime", () => {
  test("25分 → 25:00", () => {
    expect(TimerCore.formatTime(25 * 60)).toBe("25:00");
  });

  test("0秒 → 00:00", () => {
    expect(TimerCore.formatTime(0)).toBe("00:00");
  });

  test("61秒 → 01:01", () => {
    expect(TimerCore.formatTime(61)).toBe("01:01");
  });

  test("5分 → 05:00", () => {
    expect(TimerCore.formatTime(300)).toBe("05:00");
  });

  test("59分59秒 → 59:59", () => {
    expect(TimerCore.formatTime(3599)).toBe("59:59");
  });
});

// ============================================================
// getPhaseDuration
// ============================================================
describe("getPhaseDuration", () => {
  test("focus → focus_minutes * 60", () => {
    expect(TimerCore.getPhaseDuration("focus", DEFAULT_SETTINGS)).toBe(25 * 60);
  });

  test("short_break → short_break_minutes * 60", () => {
    expect(TimerCore.getPhaseDuration("short_break", DEFAULT_SETTINGS)).toBe(5 * 60);
  });

  test("long_break → long_break_minutes * 60", () => {
    expect(TimerCore.getPhaseDuration("long_break", DEFAULT_SETTINGS)).toBe(15 * 60);
  });

  test("カスタム設定が反映される", () => {
    const settings = makeSettings({ focus_minutes: 50 });
    expect(TimerCore.getPhaseDuration("focus", settings)).toBe(50 * 60);
  });
});

// ============================================================
// createInitialState
// ============================================================
describe("createInitialState", () => {
  test("初期状態が正しい", () => {
    const s = TimerCore.createInitialState(DEFAULT_SETTINGS);
    expect(s.phase).toBe("focus");
    expect(s.activeSet).toBe(1);
    expect(s.hasStarted).toBe(false);
    expect(s.isRunning).toBe(false);
    expect(s.remainingSeconds).toBe(25 * 60);
  });

  test("カスタム設定が初期残時間に反映される", () => {
    const settings = makeSettings({ focus_minutes: 10 });
    const s = TimerCore.createInitialState(settings);
    expect(s.remainingSeconds).toBe(10 * 60);
  });
});

// ============================================================
// phaseLabel
// ============================================================
describe("phaseLabel", () => {
  test("focus → 集中", () => {
    expect(TimerCore.phaseLabel("focus")).toBe("集中");
  });

  test("short_break → 短休憩", () => {
    expect(TimerCore.phaseLabel("short_break")).toBe("短休憩");
  });

  test("long_break → 長休憩", () => {
    expect(TimerCore.phaseLabel("long_break")).toBe("長休憩");
  });

  test("未知のフェーズはそのまま返す", () => {
    expect(TimerCore.phaseLabel("unknown")).toBe("unknown");
  });
});

// ============================================================
// start
// ============================================================
describe("start", () => {
  test("idle 状態から開始", () => {
    const s = TimerCore.createInitialState(DEFAULT_SETTINGS);
    const next = TimerCore.start(s);
    expect(next.isRunning).toBe(true);
    expect(next.hasStarted).toBe(true);
  });

  test("既に実行中なら状態は変わらない", () => {
    const s = { ...TimerCore.createInitialState(DEFAULT_SETTINGS), isRunning: true };
    const next = TimerCore.start(s);
    expect(next).toBe(s);
  });
});

// ============================================================
// pause
// ============================================================
describe("pause", () => {
  test("実行中を一時停止", () => {
    const s = { ...TimerCore.createInitialState(DEFAULT_SETTINGS), isRunning: true, hasStarted: true };
    const next = TimerCore.pause(s);
    expect(next.isRunning).toBe(false);
    expect(next.hasStarted).toBe(true);
  });

  test("停止中に pause しても変わらない", () => {
    const s = TimerCore.createInitialState(DEFAULT_SETTINGS);
    const next = TimerCore.pause(s);
    expect(next).toBe(s);
  });
});

// ============================================================
// tick
// ============================================================
describe("tick", () => {
  test("残り秒数が1減る", () => {
    const s = {
      ...TimerCore.createInitialState(DEFAULT_SETTINGS),
      isRunning: true,
      remainingSeconds: 100,
    };
    const next = TimerCore.tick(s);
    expect(next.remainingSeconds).toBe(99);
  });

  test("残り0で次フェーズに進む", () => {
    const s = {
      ...TimerCore.createInitialState(DEFAULT_SETTINGS),
      isRunning: true,
      remainingSeconds: 0,
      phase: "focus",
      activeSet: 1,
    };
    const next = TimerCore.tick(s);
    expect(next.phase).toBe("short_break");
    expect(next.isRunning).toBe(true);
  });
});

// ============================================================
// nextPhase
// ============================================================
describe("nextPhase", () => {
  test("focus (セット1) → short_break", () => {
    const s = TimerCore.createInitialState(DEFAULT_SETTINGS);
    const next = TimerCore.nextPhase(s);
    expect(next.phase).toBe("short_break");
    expect(next.remainingSeconds).toBe(5 * 60);
  });

  test("focus (セット4=long_break_interval) → long_break", () => {
    const s = { ...TimerCore.createInitialState(DEFAULT_SETTINGS), activeSet: 4 };
    const next = TimerCore.nextPhase(s);
    expect(next.phase).toBe("long_break");
    expect(next.remainingSeconds).toBe(15 * 60);
  });

  test("short_break → focus (セット+1)", () => {
    const s = {
      ...TimerCore.createInitialState(DEFAULT_SETTINGS),
      phase: "short_break",
      activeSet: 1,
    };
    const next = TimerCore.nextPhase(s);
    expect(next.phase).toBe("focus");
    expect(next.activeSet).toBe(2);
    expect(next.remainingSeconds).toBe(25 * 60);
  });

  test("long_break → focus (セット1に戻る)", () => {
    const s = {
      ...TimerCore.createInitialState(DEFAULT_SETTINGS),
      phase: "long_break",
      activeSet: 4,
    };
    const next = TimerCore.nextPhase(s);
    expect(next.phase).toBe("focus");
    expect(next.activeSet).toBe(1);
    expect(next.remainingSeconds).toBe(25 * 60);
  });
});

// ============================================================
// reset
// ============================================================
describe("reset", () => {
  test("途中状態からリセットで初期化される", () => {
    const s = {
      ...TimerCore.createInitialState(DEFAULT_SETTINGS),
      phase: "short_break",
      activeSet: 3,
      hasStarted: true,
      isRunning: true,
      remainingSeconds: 42,
    };
    const next = TimerCore.reset(s);
    expect(next.phase).toBe("focus");
    expect(next.activeSet).toBe(1);
    expect(next.hasStarted).toBe(false);
    expect(next.isRunning).toBe(false);
    expect(next.remainingSeconds).toBe(25 * 60);
  });

  test("新しい設定を渡すと反映される", () => {
    const s = TimerCore.createInitialState(DEFAULT_SETTINGS);
    const newSettings = makeSettings({ focus_minutes: 50 });
    const next = TimerCore.reset(s, newSettings);
    expect(next.settings.focus_minutes).toBe(50);
    expect(next.remainingSeconds).toBe(50 * 60);
  });
});

// ============================================================
// skip
// ============================================================
describe("skip", () => {
  test("focus をスキップ → short_break", () => {
    const s = {
      ...TimerCore.createInitialState(DEFAULT_SETTINGS),
      hasStarted: true,
      isRunning: true,
    };
    const next = TimerCore.skip(s);
    expect(next.phase).toBe("short_break");
    expect(next.isRunning).toBe(false);
    expect(next.hasStarted).toBe(true);
  });

  test("short_break をスキップ → focus (セット+1)", () => {
    const s = {
      ...TimerCore.createInitialState(DEFAULT_SETTINGS),
      phase: "short_break",
      activeSet: 2,
      hasStarted: true,
      isRunning: true,
    };
    const next = TimerCore.skip(s);
    expect(next.phase).toBe("focus");
    expect(next.activeSet).toBe(3);
    expect(next.isRunning).toBe(false);
  });
});

// ============================================================
// 全サイクルの統合テスト
// ============================================================
describe("全4セットサイクル", () => {
  test("focus→short_break を3回、4回目で long_break、その後 focus セット1に戻る", () => {
    let s = TimerCore.createInitialState(DEFAULT_SETTINGS);

    // セット 1: focus → short_break
    s = TimerCore.nextPhase(s);
    expect(s.phase).toBe("short_break");
    s = TimerCore.nextPhase(s);
    expect(s.phase).toBe("focus");
    expect(s.activeSet).toBe(2);

    // セット 2: focus → short_break
    s = TimerCore.nextPhase(s);
    expect(s.phase).toBe("short_break");
    s = TimerCore.nextPhase(s);
    expect(s.phase).toBe("focus");
    expect(s.activeSet).toBe(3);

    // セット 3: focus → short_break
    s = TimerCore.nextPhase(s);
    expect(s.phase).toBe("short_break");
    s = TimerCore.nextPhase(s);
    expect(s.phase).toBe("focus");
    expect(s.activeSet).toBe(4);

    // セット 4: focus → long_break
    s = TimerCore.nextPhase(s);
    expect(s.phase).toBe("long_break");

    // long_break → focus セット1
    s = TimerCore.nextPhase(s);
    expect(s.phase).toBe("focus");
    expect(s.activeSet).toBe(1);
  });
});
