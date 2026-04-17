/**
 * timer-core.js — 純粋ロジック（DOM非依存）
 *
 * ブラウザでは <script> で読み込み、テストでは require() で利用する。
 */
const TimerCore = (() => {
  const PHASE_LABELS = {
    focus: "集中",
    short_break: "短休憩",
    long_break: "長休憩",
  };

  function createInitialState(settings) {
    return {
      phase: "focus",
      activeSet: 1,
      hasStarted: false,
      isRunning: false,
      remainingSeconds: getPhaseDuration("focus", settings),
      settings,
    };
  }

  function defaultSettings() {
    return {
      focus_minutes: 25,
      short_break_minutes: 5,
      long_break_minutes: 15,
      long_break_interval: 4,
    };
  }

  function getPhaseDuration(phase, settings) {
    if (phase === "short_break") {
      return settings.short_break_minutes * 60;
    }
    if (phase === "long_break") {
      return settings.long_break_minutes * 60;
    }
    return settings.focus_minutes * 60;
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function nextPhase(state) {
    if (state.phase === "focus") {
      const phase =
        state.activeSet % state.settings.long_break_interval === 0
          ? "long_break"
          : "short_break";
      return {
        ...state,
        phase,
        remainingSeconds: getPhaseDuration(phase, state.settings),
      };
    }

    const nextSet =
      (state.activeSet % state.settings.long_break_interval) + 1;
    return {
      ...state,
      phase: "focus",
      activeSet: nextSet,
      remainingSeconds: getPhaseDuration("focus", state.settings),
    };
  }

  function tick(state) {
    if (!state.isRunning) {
      return state;
    }
    if (state.remainingSeconds > 0) {
      return { ...state, remainingSeconds: state.remainingSeconds - 1 };
    }
    // 時間切れ → フェーズ進行
    const advanced = nextPhase(state);
    return { ...advanced, hasStarted: true, isRunning: true };
  }

  function start(state) {
    if (state.isRunning) {
      return state;
    }
    return { ...state, hasStarted: true, isRunning: true };
  }

  function pause(state) {
    if (!state.isRunning) {
      return state;
    }
    return { ...state, isRunning: false };
  }

  function reset(state, settings) {
    return createInitialState(settings || state.settings);
  }

  function skip(state) {
    const advanced = nextPhase(state);
    return { ...advanced, isRunning: false, hasStarted: state.hasStarted };
  }

  function phaseLabel(phase) {
    return PHASE_LABELS[phase] || phase;
  }

  return {
    PHASE_LABELS,
    createInitialState,
    defaultSettings,
    getPhaseDuration,
    formatTime,
    nextPhase,
    tick,
    start,
    pause,
    reset,
    skip,
    phaseLabel,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = TimerCore;
}
