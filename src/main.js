import './style.css';
import {
  convertAmount,
  getLatestRate,
  getSupportedCurrencies
} from './api/fx.js';

function initBackgroundCanvas() {
  const canvas = document.querySelector('#bg-canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) {
    return;
  }

  const particles = [];
  const particleCount = 42;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function seedParticles() {
    particles.length = 0;
    for (let i = 0; i < particleCount; i += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1 + Math.random() * 2.6,
        vx: -0.25 + Math.random() * 0.5,
        vy: -0.2 + Math.random() * 0.4
      });
    }
  }

  function drawBackground(time) {
    const w = canvas.width;
    const h = canvas.height;
    const t = time * 0.00015;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(0.55, '#122243');
    gradient.addColorStop(1, '#0b1324');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const glowX = w * (0.2 + Math.sin(t) * 0.07);
    const glowY = h * (0.18 + Math.cos(t * 0.9) * 0.06);
    const glow = ctx.createRadialGradient(glowX, glowY, 20, glowX, glowY, Math.max(w, h) * 0.45);
    glow.addColorStop(0, 'rgba(96, 165, 250, 0.26)');
    glow.addColorStop(1, 'rgba(96, 165, 250, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  function drawParticles() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(191, 219, 254, 0.45)';
      ctx.fill();
    }
  }

  function animate(time) {
    drawBackground(time);
    drawParticles();
    requestAnimationFrame(animate);
  }

  resize();
  seedParticles();
  window.addEventListener('resize', () => {
    resize();
    seedParticles();
  });
  requestAnimationFrame(animate);
}

initBackgroundCanvas();

const amountInput = document.querySelector('#amount');
const fromSelect = document.querySelector('#from');
const toSelect = document.querySelector('#to');
const convertButton = document.querySelector('#convert');
const swapButton = document.querySelector('#swap');
const resultEl = document.querySelector('#result');
const metaEl = document.querySelector('#meta');
const panelEl = document.querySelector('#panel');

function setLoading(loading) {
  convertButton.disabled = loading;
  swapButton.disabled = loading;
  convertButton.textContent = loading ? 'Loading...' : 'Convert Currency';
}

function renderError(message) {
  resultEl.textContent = `Error: ${message}`;
  resultEl.classList.add('error');
  panelEl.classList.remove('is-ready');
  panelEl.classList.add('is-error');
}

function clearError() {
  resultEl.classList.remove('error');
  panelEl.classList.remove('is-error');
}

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 4
  }).format(amount);
}

async function loadCurrencies() {
  const symbols = await getSupportedCurrencies();
  const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
  const entries = Object.entries(symbols)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code]) => ({
      code,
      description: currencyNames.of(code) || code
    }));

  const options = entries
    .map(({ code, description }) => `<option value="${code}" title="${description}">${code}</option>`)
    .join('');

  fromSelect.innerHTML = options;
  toSelect.innerHTML = options;

  fromSelect.value = 'USD';
  toSelect.value = 'TWD';
}

async function runConvert() {
  clearError();
  setLoading(true);
  metaEl.textContent = '';

  try {
    const amount = Number(amountInput.value || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Please enter a valid amount');
    }

    const from = fromSelect.value;
    const to = toSelect.value;

    const [converted, latest] = await Promise.all([
      convertAmount(amount, from, to),
      getLatestRate(from, to)
    ]);

    const rateText = Number.isFinite(Number(latest.rate))
      ? Number(latest.rate).toFixed(6)
      : 'N/A';
    resultEl.textContent = `${formatCurrency(amount, from)} = ${formatCurrency(converted.result, to)}`;
    metaEl.textContent = `1 ${from} = ${rateText} ${to} | Updated: ${latest.date}`;
    panelEl.classList.add('is-ready');
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
  } finally {
    setLoading(false);
  }
}

swapButton.addEventListener('click', () => {
  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;
});

convertButton.addEventListener('click', runConvert);

amountInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    runConvert();
  }
});

loadCurrencies()
  .then(runConvert)
  .catch((error) => renderError(error instanceof Error ? error.message : String(error)));
