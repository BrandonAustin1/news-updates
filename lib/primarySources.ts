const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';

function getFetchOptions(timeoutMs = 3500) {
  return {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml,application/json,text/csv',
    },
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 60 },
  };
}

// Universal St. Louis Fed FRED Parser (Public CSV fallback for high reliability)
async function fetchFredSeries(seriesId: string, suffix = '%'): Promise<string | null> {
  try {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
    const res = await fetch(url, getFetchOptions(3000));
    if (!res.ok) return null;
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return null;
    const lastLine = lines[lines.length - 1];
    const val = lastLine.split(',')[1]?.trim();
    return val && val !== '.' ? `${val}${suffix}` : null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// 1. UK (Office for National Statistics & Bank of England)
// -----------------------------------------------------------------------------
async function fetchOnsSeries(cdid: string, dataset: string): Promise<string | null> {
  try {
    const url = `https://api.ons.gov.uk/timeseries/${cdid.toLowerCase()}/dataset/${dataset.toLowerCase()}/data`;
    const res = await fetch(url, getFetchOptions());
    if (!res.ok) return null;
    const json = await res.json();
    const records = json.months && json.months.length > 0 ? json.months : json.quarters;
    if (!records || records.length === 0) return null;
    const latest = records[records.length - 1];
    return latest && latest.value ? `${latest.value}%` : null;
  } catch {
    return null;
  }
}

async function fetchBankOfEnglandRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.bankofengland.co.uk/boeapps/iadb/Repo.asp', getFetchOptions());
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/class="table-repo"[^>]*>[\s\S]*?<td>([\d\.]+)<\/td>/i);
    return match ? `${match[1]}%` : null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// 2. Eurozone (European Central Bank)
// -----------------------------------------------------------------------------
async function fetchEcbRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.ecb.europa.eu/rss/press.html', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const depMatch = xml.match(/deposit facility rate.*?(?:to|at)\s*([0-9.]+)%/i);
    if (depMatch) return `${depMatch[1]}%`;
    const mainMatch = xml.match(/main refinancing operations.*?(?:to|at)\s*([0-9.]+)%/i);
    return mainMatch ? `${mainMatch[1]}%` : null;
  } catch {
    return fetchFredSeries('ECBDFR');
  }
}

async function fetchEurostatCpi(): Promise<string | null> {
  return fetchFredSeries('CP0000EZ19M086NEST');
}

// -----------------------------------------------------------------------------
// 3. Canada (Bank of Canada & Statistics Canada)
// -----------------------------------------------------------------------------
async function fetchBocRate(): Promise<string | null> {
  try {
    const res = await fetch(
      'https://www.bankofcanada.ca/valet/observations/group/POLICY_INTEREST_RATES/json?recent=1',
      getFetchOptions()
    );
    if (!res.ok) return null;
    const data = await res.json();
    const obs = data?.observations?.[0]?.V39079?.v;
    return obs ? `${obs}%` : null;
  } catch {
    return fetchFredSeries('INTDSRCAM193N');
  }
}

async function fetchStatCanCpi(subMetric?: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.statcan.gc.ca/en/dai-quo', getFetchOptions());
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/Consumer Price Index.*?(?:rose|fell|increased|decreased) by ([0-9.]+)\%/i);
      if (match) return `${match[1]}%`;
    }
  } catch {}

  if (subMetric === 'median') return fetchFredSeries('CPMEDICAM657N');
  if (subMetric === 'trimmed') return fetchFredSeries('CPTRIMCAM657N');
  return fetchFredSeries('CPALTT01CAM657N');
}

// -----------------------------------------------------------------------------
// 4. Japan (Bank of Japan)
// -----------------------------------------------------------------------------
async function fetchBojRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.boj.or.jp/en/statistics/dl/depo/tento/index.htm', getFetchOptions());
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/Basic Policy Rate[\s\S]*?<td[^>]*>([\d\.]+)%?<\/td>/i);
    return match ? `${match[1]}%` : null;
  } catch {
    return fetchFredSeries('IRSTCB01JPM156N');
  }
}

async function fetchJapanCpi(): Promise<string | null> {
  return fetchFredSeries('JPNCPIALLMINMEI');
}

// -----------------------------------------------------------------------------
// 5. Australia & New Zealand (RBA & RBNZ)
// -----------------------------------------------------------------------------
async function fetchRbaRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.rba.gov.au/rss/rss-cb-target.xml', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const match = xml.match(/target\s*(?:is|at|remains)?\s*([0-9.]+)%/i);
    return match ? `${match[1]}%` : null;
  } catch {
    return fetchFredSeries('RBATCTR');
  }
}

async function fetchAustraliaCpi(): Promise<string | null> {
  return fetchFredSeries('AUSCPIALLQINMEI');
}

async function fetchRbnzRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.rbnz.govt.nz/monetary-policy/official-cash-rate-decisions', getFetchOptions());
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/OCR(?:\s+is|\s+at|\s+to)?\s+([0-9.]+)%/i);
    return match ? `${match[1]}%` : null;
  } catch {
    return fetchFredSeries('IRSTCB01NZM156N');
  }
}

// -----------------------------------------------------------------------------
// 6. Switzerland (Swiss National Bank)
// -----------------------------------------------------------------------------
async function fetchSnbRate(): Promise<string | null> {
  try {
    const res = await fetch('https://data.snb.ch/api/cube/snbziredev/data/csv/en', getFetchOptions());
    if (!res.ok) return null;
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const val = lastLine.split(';')[1]?.replace(/"/g, '').trim();
    return val ? `${val}%` : null;
  } catch {
    return fetchFredSeries('IRSTCI01CHM156N');
  }
}

// -----------------------------------------------------------------------------
// Master Dispatcher
// -----------------------------------------------------------------------------
export async function resolvePrimaryActual(title: string, currency: string): Promise<string | null> {
  const t = title.toLowerCase();
  const c = currency.toUpperCase();

  // Document/speech releases have no numeric actuals
  if (
    t.includes('speaks') ||
    t.includes('testifies') ||
    t.includes('statement') ||
    t.includes('projection') ||
    t.includes('minutes') ||
    t.includes('press conference') ||
    t.includes('holiday')
  ) {
    return null;
  }

  // GBP
  if (c === 'GBP' || c === 'UK') {
    if (t.includes('cpi y/y')) return fetchOnsSeries('d7g7', 'mm23');
    if (t.includes('cpi m/m')) return fetchOnsSeries('d7bt', 'mm23');
    if (t.includes('cpi') || t.includes('inflation')) return fetchOnsSeries('l55o', 'mm23');
    if (t.includes('official bank rate') || t.includes('interest rate')) return fetchBankOfEnglandRate();
    if (t.includes('claimant') || t.includes('unemployment')) return fetchOnsSeries('mgsx', 'lms');
    if (t.includes('gdp')) return fetchOnsSeries('ihyq', 'qna');
  }

  // USD (Using DFEDTARU for live policy rate ceiling)
  if (c === 'USD' || c === 'US') {
    if (t.includes('fed funds') || t.includes('federal funds') || t.includes('interest rate')) return fetchFredSeries('DFEDTARU');
    if (t.includes('core cpi')) return fetchFredSeries('CPILFESL');
    if (t.includes('cpi')) return fetchFredSeries('CPIAUCSL');
    if (t.includes('non-farm') || t.includes('nfp') || t.includes('payrolls')) return fetchFredSeries('PAYEMS', 'K');
    if (t.includes('unemployment rate') || t.includes('jobless claims')) return fetchFredSeries('UNRATE');
    if (t.includes('retail sales')) return fetchFredSeries('RSAFS', 'B');
    if (t.includes('gdp')) return fetchFredSeries('GDP', 'B');
  }

  // EUR
  if (c === 'EUR') {
    if (t.includes('main refinancing') || t.includes('deposit facility') || t.includes('rate decision') || t.includes('monetary policy')) {
      return fetchEcbRate();
    }
    if (t.includes('cpi') || t.includes('hicp') || t.includes('inflation')) return fetchEurostatCpi();
    if (t.includes('gdp')) return fetchFredSeries('CLVMNACSCAB1GQEA19', 'B');
  }

  // CAD
  if (c === 'CAD') {
    if (t.includes('overnight rate') || t.includes('rate decision') || t.includes('bank of canada')) return fetchBocRate();
    if (t.includes('median cpi')) return fetchStatCanCpi('median');
    if (t.includes('trimmed cpi')) return fetchStatCanCpi('trimmed');
    if (t.includes('cpi') || t.includes('inflation')) return fetchStatCanCpi();
    if (t.includes('unemployment') || t.includes('employment change')) return fetchFredSeries('LRUNTTTTCAM156S');
  }

  // JPY
  if (c === 'JPY') {
    if (t.includes('policy rate') || t.includes('monetary policy') || t.includes('rate decision')) return fetchBojRate();
    if (t.includes('cpi') || t.includes('inflation')) return fetchJapanCpi();
  }

  // AUD
  if (c === 'AUD') {
    if (t.includes('cash rate') || t.includes('rba rate') || t.includes('rate decision')) return fetchRbaRate();
    if (t.includes('cpi') || t.includes('inflation')) return fetchAustraliaCpi();
    if (t.includes('unemployment')) return fetchFredSeries('LRUN64TTAUQ156S');
  }

  // NZD
  if (c === 'NZD') {
    if (t.includes('official cash rate') || t.includes('rate decision')) return fetchRbnzRate();
    if (t.includes('cpi') || t.includes('inflation')) return fetchFredSeries('NZLCPIALLQINMEI');
  }

  // CHF
  if (c === 'CHF') {
    if (t.includes('policy rate') || t.includes('snb rate') || t.includes('rate decision')) return fetchSnbRate();
    if (t.includes('cpi') || t.includes('inflation')) return fetchFredSeries('CHECPIALLMINMEI');
  }

  return null;
}