const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function getFetchOptions(timeoutMs = 3500) {
  return {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml,application/xml,application/json',
    },
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 60 },
  };
}

// --------------------------------------------------------------------------
// 1. UK (Office for National Statistics & Bank of England)
// --------------------------------------------------------------------------
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

async function fetchBoeRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.bankofengland.co.uk/rss/news', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const rateMatch = xml.match(/Bank Rate (?:maintained|cut|increased|reduced|raised) (?:at|to) ([0-9.]+)%/i);
    const voteMatch = xml.match(/voted by a majority of ([0-9]+[–-][0-9]+)/i);
    if (rateMatch) {
      return voteMatch ? `${rateMatch[1]}% (MPC: ${voteMatch[1]})` : `${rateMatch[1]}%`;
    }
    return null;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// 2. US (BLS, BEA, Federal Reserve, Census, DoL)
// --------------------------------------------------------------------------
async function fetchBlsCpi(isCore: boolean, isMoM: boolean): Promise<string | null> {
  try {
    const res = await fetch('https://www.bls.gov/news.release/cpi.nr0.htm', getFetchOptions());
    if (!res.ok) return null;
    const text = await res.text();
    const pattern = isCore
      ? (isMoM ? /all items less food and energy (?:index )?(?:rose|increased|declined|fell) ([0-9.]+) percent in/i : /all items less food and energy index (?:rose|increased|fell) ([0-9.]+) percent over the (?:past|last) 12 months/i)
      : (isMoM ? /all items index (?:rose|increased|fell|changed) ([0-9.]+) percent in/i : /all items (?:index )?(?:increased|rose|declined) ([0-9.]+) percent (?:over|for) the (?:last|past) 12/i);
    const match = text.match(pattern);
    return match ? `${match[1]}%` : null;
  } catch {
    return null;
  }
}

async function fetchBlsEmployment(): Promise<{ nfp?: string; unemp?: string; wagesMoM?: string } | null> {
  try {
    const res = await fetch('https://www.bls.gov/news.release/empsit.nr0.htm', getFetchOptions());
    if (!res.ok) return null;
    const text = await res.text();
    const nfpMatch = text.match(/total nonfarm payroll employment (?:increased|changed|rose) by ([0-9,]+)/i);
    const unempMatch = text.match(/unemployment rate (?:was unchanged at|changed little at|rose to|declined to|fell to) ([0-9.]+) percent/i);
    const wageMatch = text.match(/average hourly earnings.*?(?:rose|increased|changed) by ([0-9.]+) percent/i);

    return {
      nfp: nfpMatch ? `${nfpMatch[1].replace(/,/g, '')}K` : undefined,
      unemp: unempMatch ? `${unempMatch[1]}%` : undefined,
      wagesMoM: wageMatch ? `${wageMatch[1]}%` : undefined,
    };
  } catch {
    return null;
  }
}

async function fetchBlsPpi(): Promise<string | null> {
  try {
    const res = await fetch('https://www.bls.gov/news.release/ppi.nr0.htm', getFetchOptions());
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/final demand (?:rose|increased|declined|fell) ([0-9.]+) percent in/i);
    return match ? `${match[1]}%` : null;
  } catch {
    return null;
  }
}

async function fetchFedFundsRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.federalreserve.gov/feeds/press_monetary.xml', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const match = xml.match(/target range for the federal funds rate (?:at|to) ([0-9./\-]+ to [0-9./\-]+ percent|[0-9.]+%)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function fetchBeaData(isPce: boolean): Promise<string | null> {
  try {
    const res = await fetch('https://apps.bea.gov/rss/rss.xml', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const pattern = isPce
      ? /PCE price index excluding food and energy increased ([0-9.]+) percent/i
      : /Real gross domestic product \(GDP\) increased at an annual rate of ([0-9.]+) percent/i;
    const match = xml.match(pattern);
    return match ? `${match[1]}%` : null;
  } catch {
    return null;
  }
}

async function fetchJoblessClaims(): Promise<string | null> {
  try {
    const res = await fetch('https://www.dol.gov/rss/newsreleases.xml', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const match = xml.match(/initial claims.*?(?:was|decreased by|increased by) ([0-9,]+)/i);
    return match ? `${match[1].replace(/,/g, '')}K` : null;
  } catch {
    return null;
  }
}

async function fetchCensusRetailSales(): Promise<string | null> {
  try {
    const res = await fetch('https://www.census.gov/economic-indicators/rss/', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const match = xml.match(/Retail (?:and Food Services )?Sales.*?(?:increased|decreased|virtually unchanged).*?([0-9.]+) percent/i);
    return match ? `${match[1]}%` : null;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// 3. JAPAN (BOJ & Statistics Bureau)
// --------------------------------------------------------------------------
async function fetchBojRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.boj.or.jp/en/rss/whatsnew.xml', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const rateMatch = xml.match(/uncollateralized overnight call rate (?:to|at) around ([0-9.]+)%/i);
    return rateMatch ? `${rateMatch[1]}%` : null;
  } catch {
    return null;
  }
}

async function fetchJapanCpi(): Promise<string | null> {
  try {
    const res = await fetch('https://www.stat.go.jp/english/data/cpi/1581.html', getFetchOptions());
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/Consumer Price Index.*?(?:increased|rose|fell) by ([0-9.]+)%/i);
    return match ? `${match[1]}%` : null;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// 4. OTHER MAJORS (EUR, CAD, AUD, NZD, CHF)
// --------------------------------------------------------------------------
async function fetchEcbRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.ecb.europa.eu/rss/press.html', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const depMatch = xml.match(/deposit facility rate.*?(?:to|at) ([0-9.]+)%/i);
    const mainMatch = xml.match(/main refinancing operations.*?(?:to|at) ([0-9.]+)%/i);
    if (depMatch) return `${depMatch[1]}% (Deposit)`;
    if (mainMatch) return `${mainMatch[1]}%`;
    return null;
  } catch {
    return null;
  }
}

async function fetchBocRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.bankofcanada.ca/valet/observations/V39079/json?recent=1', getFetchOptions());
    if (!res.ok) return null;
    const json = await res.json();
    const obs = json.observations?.[0]?.V39079?.v;
    return obs ? `${obs}%` : null;
  } catch {
    return null;
  }
}

async function fetchRbaRate(): Promise<string | null> {
  try {
    const res = await fetch('https://www.rba.gov.au/rss/rss-cb-media-releases.xml', getFetchOptions());
    if (!res.ok) return null;
    const xml = await res.text();
    const match = xml.match(/cash rate target (?:at|to) ([0-9.]+) (?:per cent|%)/i);
    return match ? `${match[1]}%` : null;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// 5. MASTER RESOLVER
// --------------------------------------------------------------------------
export async function resolvePrimaryActual(title: string, currency: string): Promise<string | null> {
  const t = title.toLowerCase();

  if (currency === 'GBP') {
    if (t.includes('cpi y/y')) return await fetchOnsSeries('d7g7', 'mm23');
    if (t.includes('cpi m/m')) return await fetchOnsSeries('d7bt', 'mm23');
    if (t.includes('core cpi y/y')) return await fetchOnsSeries('dk9t', 'mm23');
    if (t.includes('retail sales y/y')) return await fetchOnsSeries('j542', 'drsi');
    if (t.includes('retail sales m/m')) return await fetchOnsSeries('j543', 'drsi');
    if (t.includes('gdp m/m')) return await fetchOnsSeries('ec2y', 'mgdp');
    if (t.includes('gdp q/q') || t.includes('prelim gdp')) return await fetchOnsSeries('abmi', 'ukea');
    if (t.includes('unemployment rate')) return await fetchOnsSeries('mgsx', 'lms');
    if (t.includes('claimant count')) return await fetchOnsSeries('bcjd', 'lms');
    if (t.includes('average earnings')) return await fetchOnsSeries('kac3', 'lms');
    if (t.includes('bank rate') || t.includes('monetary policy summary')) return await fetchBoeRate();
  }

  if (currency === 'USD') {
    if (t.includes('core cpi y/y')) return await fetchBlsCpi(true, false);
    if (t.includes('core cpi m/m')) return await fetchBlsCpi(true, true);
    if (t.includes('cpi y/y')) return await fetchBlsCpi(false, false);
    if (t.includes('cpi m/m')) return await fetchBlsCpi(false, true);
    if (t.includes('non-farm') || t.includes('payrolls')) {
      const jobs = await fetchBlsEmployment();
      return jobs?.nfp || null;
    }
    if (t.includes('unemployment rate')) {
      const jobs = await fetchBlsEmployment();
      return jobs?.unemp || null;
    }
    if (t.includes('average hourly earnings')) {
      const jobs = await fetchBlsEmployment();
      return jobs?.wagesMoM || null;
    }
    if (t.includes('ppi m/m') || t.includes('core ppi')) return await fetchBlsPpi();
    if (t.includes('federal funds rate') || t.includes('fomc statement')) return await fetchFedFundsRate();
    if (t.includes('gdp')) return await fetchBeaData(false);
    if (t.includes('core pce')) return await fetchBeaData(true);
    if (t.includes('unemployment claims') || t.includes('jobless claims')) return await fetchJoblessClaims();
    if (t.includes('retail sales')) return await fetchCensusRetailSales();
  }

  if (currency === 'JPY') {
    if (t.includes('policy rate') || t.includes('monetary policy statement')) return await fetchBojRate();
    if (t.includes('national cpi') || t.includes('tokyo cpi') || t.includes('cpi y/y')) return await fetchJapanCpi();
  }

  if (currency === 'EUR') {
    if (t.includes('main refinancing') || t.includes('monetary policy') || t.includes('rate decision')) return await fetchEcbRate();
  }

  if (currency === 'CAD') {
    if (t.includes('overnight rate') || t.includes('rate decision') || t.includes('bank of canada')) return await fetchBocRate();
  }

  if (currency === 'AUD') {
    if (t.includes('cash rate') || t.includes('rba rate') || t.includes('rate decision')) return await fetchRbaRate();
  }

  return null;
}