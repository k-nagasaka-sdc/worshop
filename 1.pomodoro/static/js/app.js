/* app.js — TimerCore を使った UI 制御 */
const phaseLabelEl = document.getElementById("phase-label");
const setCountEl = document.getElementById("set-count");
const timerDisplayEl = document.getElementById("timer-display");
const startButton = document.getElementById("btn-start");
const pauseButton = document.getElementById("btn-pause");
const resetButton = document.getElementById("btn-reset");
const skipButton = document.getElementById("btn-skip");
const settingsForm = document.getElementById("settings-form");

let timerId = null;
let state = TimerCore.createInitialState(readSettings());

function readSettings() {
  return {
    focus_minutes: readNumber("focus-minutes", 25),
    short_break_minutes: readNumber("short-break-minutes", 5),
    long_break_minutes: readNumber("long-break-minutes", 15),
    long_break_interval: readNumber("long-break-interval", 4),
  };
}

function readNumber(id, fallbackValue) {
  const input = document.getElementById(id);
  const value = Number.parseInt(input?.value ?? fallbackValue, 10);
  return Number.isFinite(value) && value > 0 ? value : fallbackValue;
}

function render() {
  timerDisplayEl.textContent = TimerCore.formatTime(state.remainingSeconds);
  phaseLabelEl.textContent = TimerCore.phaseLabel(state.phase);
  setCountEl.textContent = `セット ${state.activeSet} / ${state.settings.long_break_interval}`;

  startButton.disabled = state.isRunning || state.hasStarted;
  pauseButton.disabled = !state.hasStarted;
  pauseButton.textContent = state.isRunning ? "一時停止" : "再開";
}

function clearTimerId() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function onTick() {
  state = TimerCore.tick(state);
  if (state.remainingSeconds === 0) {
    // フェーズ切替直後: tick が nextPhase + isRunning=true を返す
    // → interval は継続
  }
  render();
}

function startTimer() {
  state = TimerCore.start(state);
  if (state.isRunning && timerId === null) {
    timerId = window.setInterval(onTick, 1000);
  }
  render();
}

function pauseOrResumeTimer() {
  if (state.isRunning) {
    state = TimerCore.pause(state);
    clearTimerId();
    render();
    return;
  }
  startTimer();
}

function resetTimer() {
  clearTimerId();
  state = TimerCore.reset(state, readSettings());
  render();
}

function skipPhase() {
  clearTimerId();
  state = TimerCore.skip(state);
  render();
}

startButton.addEventListener("click", startTimer);
pauseButton.addEventListener("click", pauseOrResumeTimer);
resetButton.addEventListener("click", resetTimer);
skipButton.addEventListener("click", skipPhase);

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  resetTimer();
});

render();