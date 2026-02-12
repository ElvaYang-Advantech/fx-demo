const API_BASE = 'https://api.exchangerate.host';

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

  const data = await response.json();
  if (data && data.success === false) {
    const info = data.error?.info || 'Unknown API error';
    throw new Error(info);
  }

  return data;
}

export async function getSupportedCurrencies() {
  const data = await fetchJson('/symbols');
  return data.symbols || {};
}

export async function getLatestRate(base, target) {
  const data = await fetchJson('/latest', {
    base,
    symbols: target
  });

  return {
    rate: data.rates?.[target],
    date: data.date
  };
}

export async function convertAmount(amount, from, to) {
  const data = await fetchJson('/convert', {
    from,
    to,
    amount
  });

  return {
    result: data.result,
    date: data.date,
    query: data.query
  };
}
