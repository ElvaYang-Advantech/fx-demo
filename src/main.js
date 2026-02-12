import './style.css';
import {
  convertAmount,
  getLatestRate,
  getSupportedCurrencies
} from './api/fx.js';

const amountInput = document.querySelector('#amount');
const fromSelect = document.querySelector('#from');
const toSelect = document.querySelector('#to');
const convertButton = document.querySelector('#convert');
const swapButton = document.querySelector('#swap');
const resultEl = document.querySelector('#result');
const metaEl = document.querySelector('#meta');

function setLoading(loading) {
  convertButton.disabled = loading;
  convertButton.textContent = loading ? '查詢中...' : '查詢並轉換';
}

function renderError(message) {
  resultEl.textContent = `發生錯誤：${message}`;
  resultEl.classList.add('error');
}

function clearError() {
  resultEl.classList.remove('error');
}

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    maximumFractionDigits: 4
  }).format(amount);
}

async function loadCurrencies() {
  const symbols = await getSupportedCurrencies();
  const entries = Object.entries(symbols)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, description]) => ({ code, description }));

  const options = entries
    .map(({ code, description }) => `<option value="${code}">${code} - ${description}</option>`)
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
      throw new Error('請輸入有效金額');
    }

    const from = fromSelect.value;
    const to = toSelect.value;

    const [converted, latest] = await Promise.all([
      convertAmount(amount, from, to),
      getLatestRate(from, to)
    ]);

    resultEl.textContent = `${formatCurrency(amount, from)} = ${formatCurrency(converted.result, to)}`;
    metaEl.textContent = `1 ${from} = ${latest.rate} ${to} | 匯率日期：${latest.date}`;
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
