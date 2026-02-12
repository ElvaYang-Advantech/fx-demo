const API_BASE = 'https://open.er-api.com/v6';

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.result && data.result !== 'success') {
    throw new Error(data['error-type'] || 'Exchange rate API error');
  }
  return data;
}

export async function getSupportedCurrencies() {
  const data = await fetchJson('/latest/USD');
  const entries = Object.keys(data.rates || {}).sort();
  const symbols = {};

  for (const code of entries) {
    symbols[code] = code;
  }
  return symbols;
}

export async function getLatestRate(base, target) {
  const data = await fetchJson(`/latest/${base}`);
  return {
    rate: data.rates?.[target],
    date: data.time_last_update_utc || ''
  };
}

export async function convertAmount(amount, from, to) {
  const data = await fetchJson(`/latest/${from}`);
  const rate = data.rates?.[to];

  if (rate === undefined) {
    throw new Error(`Currency not supported: ${to}`);
  }

  return {
    result: amount * rate,
    date: data.time_last_update_utc || '',
    query: { amount, from, to }
  };
}
