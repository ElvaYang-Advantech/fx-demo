const API_BASE = 'https://api.frankfurter.app';

async function fetchJson(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function getSupportedCurrencies() {
  return fetchJson('/currencies');
}

export async function getLatestRate(base, target) {
  const data = await fetchJson('/latest', {
    from: base,
    to: target,
    amount: 1
  });

  return {
    rate: data.rates?.[target],
    date: data.date
  };
}

export async function convertAmount(amount, from, to) {
  const data = await fetchJson('/latest', {
    amount,
    from,
    to
  });

  return {
    result: data.rates?.[to],
    date: data.date,
    query: { amount, from, to }
  };
}
