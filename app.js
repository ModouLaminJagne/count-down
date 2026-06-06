const timeDisplay = document.getElementById('time');
const progressRing = document.getElementById('progress-ring');
const secondsInput = document.getElementById('seconds');
const startBtn = document.getElementById('start');
const resetBtn = document.getElementById('reset');
const app = document.querySelector('.app');

const DEFAULT_SECONDS = 180;
const CIRCLE_RADIUS = 45;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

let remainingSeconds = DEFAULT_SECONDS;
let totalSeconds = DEFAULT_SECONDS;
let timerId = null;
let deadlineMs = null;

progressRing.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;
progressRing.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;

function format(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateProgress() {
  const progress = 1 - remainingSeconds / totalSeconds;
  const offset = CIRCLE_CIRCUMFERENCE * (1 - progress);
  progressRing.style.strokeDashoffset = offset;
}

function render() {
  timeDisplay.textContent = format(remainingSeconds);
  updateProgress();
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  deadlineMs = null;
  startBtn.disabled = false;
  secondsInput.disabled = false;
  app.classList.remove('timer-running');

  if (remainingSeconds === 0) {
    app.classList.add('timer-complete');
    setTimeout(() => app.classList.remove('timer-complete'), 600);
    playCelebrationSound();
    showCompletionMessage();
  }
}

function getInputSeconds() {
  const parsed = Number(secondsInput.value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    secondsInput.value = String(DEFAULT_SECONDS);
    return DEFAULT_SECONDS;
  }
  return parsed;
}

function reset() {
  stopTimer();
  remainingSeconds = getInputSeconds();
  totalSeconds = remainingSeconds;
  // restore UI when resetting from completion
  hideCompletionMessage();
  render();
  app.classList.remove('timer-complete');
}

/* Completion UI and confetti */
function showCompletionMessage() {
  const timerContainer = document.querySelector('.timer-container');
  const controls = document.querySelector('.controls');
  const msg = document.getElementById('completion-message');
  if (timerContainer) timerContainer.style.display = 'none';
  if (controls) controls.style.display = 'none';
  if (msg) {
    msg.hidden = false;
    // trigger animation
    requestAnimationFrame(() => msg.classList.add('show'));
  }
  // start full-screen canvas confetti and emoji burst
  startCanvasConfetti();
  createEmojiBurst();
}

function hideCompletionMessage() {
  const timerContainer = document.querySelector('.timer-container');
  const controls = document.querySelector('.controls');
  const msg = document.getElementById('completion-message');
  if (timerContainer) timerContainer.style.display = '';
  if (controls) controls.style.display = '';
  if (msg) {
    msg.classList.remove('show');
    msg.hidden = true;
  }
  // stop canvas confetti
  stopCanvasConfetti();
}

// Canvas-based confetti animation
let _confettiAnimId = null;
let _confettiTimeout = null;
let _confettiParticles = [];
function startCanvasConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.hidden = false;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  const dpi = window.devicePixelRatio || 1;
  function resize() {
    canvas.width = Math.floor(canvas.clientWidth * dpi);
    canvas.height = Math.floor(canvas.clientHeight * dpi);
    ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
  }
  resize();
  canvas._confettiResize = resize;
  window.addEventListener('resize', resize);

  const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B6BFF', '#FF8A65'];
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  _confettiParticles = [];
  const count = Math.max(80, Math.floor((W * H) / 8000));
  for (let i = 0; i < count; i++) {
    _confettiParticles.push({
      x: Math.random() * W,
      y: Math.random() * -H * 0.5,
      w: 6 + Math.random() * 12,
      h: 6 + Math.random() * 8,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.9 - Math.random() * 0.5,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width / dpi, canvas.height / dpi);
    for (let p of _confettiParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03; // gravity
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      // respawn
      if (p.y > H + 30 || p.x < -50 || p.x > W + 50) {
        p.x = Math.random() * W;
        p.y = -10 - Math.random() * H * 0.2;
        p.vx = (Math.random() - 0.5) * 3;
        p.vy = 2 + Math.random() * 4;
      }
    }
    _confettiAnimId = requestAnimationFrame(draw);
  }

  draw();
  // stop after 4s
  _confettiTimeout = setTimeout(() => stopCanvasConfetti(), 4200);
}

function stopCanvasConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  if (_confettiAnimId) cancelAnimationFrame(_confettiAnimId);
  _confettiAnimId = null;
  if (_confettiTimeout) clearTimeout(_confettiTimeout);
  _confettiTimeout = null;
  try {
    const ctx = canvas.getContext('2d');
    ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
  } catch (e) {}
  if (canvas._confettiResize) {
    window.removeEventListener('resize', canvas._confettiResize);
    delete canvas._confettiResize;
  }
  canvas.hidden = true;
  canvas.style.display = 'none';
  _confettiParticles = [];
}

function createEmojiBurst() {
  const container = document.querySelector('#completion-message');
  if (!container) return;
  const emojis = ['🎉', '🚀', '🥳', '✨', '🔥', '🎊'];
  const emojiContainer = document.createElement('div');
  emojiContainer.className = 'emoji-container';
  for (let i = 0; i < 6; i++) {
    const e = document.createElement('div');
    e.className = 'emoji-piece';
    e.textContent = emojis[i % emojis.length];
    e.style.animationDelay = (i * 80) + 'ms';
    e.style.fontSize = (18 + Math.floor(Math.random() * 20)) + 'px';
    emojiContainer.appendChild(e);
  }
  container.appendChild(emojiContainer);
  setTimeout(() => {
    if (emojiContainer && emojiContainer.parentNode) emojiContainer.parentNode.removeChild(emojiContainer);
  }, 1400);
}

function tick() {
  if (deadlineMs === null) {
    stopTimer();
    return;
  }

  remainingSeconds = Math.max(
    0,
    Math.ceil((deadlineMs - Date.now()) / 1000)
  );
  render();

  if (remainingSeconds <= 0) {
    stopTimer();
  }
}

function playCelebrationSound() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const now = ac.currentTime;
    const notes = [880, 1174.66, 1396.91, 1760];
    notes.forEach((freq, i) => {
      const t = now + i * 0.16;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(ac.destination);
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.start(t);
      osc.stop(t + 0.16);
    });

    // small sparkle after
    const t2 = now + notes.length * 0.16 + 0.05;
    const osc2 = ac.createOscillator();
    const g2 = ac.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1400, t2);
    osc2.connect(g2);
    g2.connect(ac.destination);
    g2.gain.setValueAtTime(0.001, t2);
    g2.gain.linearRampToValueAtTime(0.22, t2 + 0.02);
    g2.gain.linearRampToValueAtTime(0.001, t2 + 0.5);
    osc2.start(t2);
    osc2.stop(t2 + 0.5);
  } catch (e) {
    // ignore audio errors (browsers may block without gesture)
    console.warn('Audio unavailable', e);
  }
}

startBtn.addEventListener('click', () => {
  if (remainingSeconds <= 0) {
    remainingSeconds = getInputSeconds();
    totalSeconds = remainingSeconds;
    render();
  }

  deadlineMs = Date.now() + remainingSeconds * 1000;
  timerId = setInterval(tick, 100);
  startBtn.disabled = true;
  secondsInput.disabled = true;
  app.classList.add('timer-running');
  tick();
});

resetBtn.addEventListener('click', reset);
secondsInput.addEventListener('change', reset);

render();
