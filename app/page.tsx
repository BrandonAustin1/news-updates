'use client';

import { useState, useEffect } from 'react';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
];

const IMPACTS = [
  {
    id: 'high',
    name: 'High Impact',
    badge: '🔴 HIGH',
    desc: 'Tier-1 market catalysts: NFP, CPI, Central Bank Rate Decisions.',
    activeBorder: 'border-red-500/80 bg-red-950/20 text-red-200',
    checkBg: 'bg-red-500 text-white',
  },
  {
    id: 'medium',
    name: 'Medium Impact',
    badge: '🟠 MED',
    desc: 'Retail Sales, PMIs, core sub-indices, employment revisions.',
    activeBorder: 'border-amber-500/80 bg-amber-950/20 text-amber-200',
    checkBg: 'bg-amber-500 text-black',
  },
  {
    id: 'low',
    name: 'Low Impact',
    badge: '⚪ LOW',
    desc: 'Bond auctions, secondary speeches, minor trade balance sheets.',
    activeBorder: 'border-zinc-500/80 bg-zinc-800/30 text-zinc-300',
    checkBg: 'bg-zinc-300 text-black',
  },
];

export default function CalendarDashboard() {
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['USD', 'GBP', 'JPY', 'CAD']);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['high', 'medium']);
  const [group, setGroup] = useState<boolean>(true);
  const [origin, setOrigin] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const toggleCurrency = (code: string) => {
    setSelectedCurrencies(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(c => c !== code) : prev
        : [...prev, code]
    );
  };

  const toggleImpact = (id: string) => {
    setSelectedImpacts(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(i => i !== id) : prev
        : [...prev, id]
    );
  };

  const params = new URLSearchParams();
  if (selectedCurrencies.length > 0) params.set('currencies', selectedCurrencies.join(','));
  if (selectedImpacts.length > 0) params.set('impacts', selectedImpacts.join(','));
  params.set('group', group ? 'true' : 'false');

  const fullUrl = origin ? `${origin}/api/calendar?${params.toString()}` : `/api/calendar?${params.toString()}`;
  const webcalUrl = fullUrl.replace(/^https?:\/\//, 'webcal://');

  const copyUrl = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#090A0F] text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              LIVE FEED ENGINE ACTIVE
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">News Updates Dispatcher</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              RFC 5545 calendar subscription with direct bureau actuals (BLS, BoE, ONS, StatCan).
            </p>
          </div>
          <div className="font-mono text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 self-start">
            <div>Tracking: <span className="text-white font-bold">{selectedCurrencies.length} Assets</span></div>
            <div>Filters: <span className="text-cyan-400 font-bold uppercase">{selectedImpacts.join(', ')}</span></div>
          </div>
        </div>

        {/* 1. Currencies */}
        <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
              1. Assets & Currencies
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCurrencies(['USD', 'GBP', 'JPY', 'CAD'])}
                className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Core 4
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrencies(CURRENCIES.map(c => c.code))}
                className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CURRENCIES.map(c => {
              const active = selectedCurrencies.includes(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleCurrency(c.code)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left transition ${
                    active
                      ? 'border-cyan-500 bg-cyan-950/20 text-white shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.flag}</span>
                    <span className="font-mono text-sm font-bold">{c.code}</span>
                  </div>
                  <span
                    style={{ width: '18px', height: '18px' }}
                    className={`rounded flex items-center justify-center text-[10px] font-bold ${
                      active ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Impact Filters */}
        <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            2. Volatility Impact Tier
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {IMPACTS.map(item => {
              const active = selectedImpacts.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleImpact(item.id)}
                  className={`flex flex-col justify-between p-4 rounded-xl border text-left transition min-h-[110px] ${
                    active
                      ? `${item.activeBorder} shadow-lg ring-1`
                      : 'border-zinc-800/60 bg-zinc-950/40 opacity-40 hover:opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-mono font-bold">{item.badge}</span>
                    <span
                      style={{ width: '20px', height: '20px' }}
                      className={`rounded flex items-center justify-center text-xs font-bold ${
                        active ? item.checkBg : 'bg-zinc-800 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{item.desc}</p>
                  <div className="mt-3 text-[10px] font-mono tracking-widest uppercase text-zinc-500">
                    {active ? '● INCLUDED IN FEED' : '○ MUTED'}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Clustering Toggle */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-200">Cluster Simultaneous Drops</div>
            <div className="text-xs text-zinc-400">Merges same-minute releases (e.g. CAD CPI + Median + Trimmed) into one card.</div>
          </div>
          <button
            type="button"
            onClick={() => setGroup(!group)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              group
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700'
            }`}
          >
            {group ? 'GROUPED [ON]' : 'EXPANDED [OFF]'}
          </button>
        </div>

        {/* 4. Action / Subscription Hub */}
        <section className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-cyan-500/40 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-cyan-400">
              3. Subscription Endpoint
            </h3>
            <p className="text-xs text-zinc-400">Live updating URL formatted for Apple Calendar and iOS Calendar accounts.</p>
          </div>

          <input
            type="text"
            readOnly
            value={fullUrl}
            className="w-full bg-zinc-950 border border-zinc-800 text-cyan-300 font-mono text-xs px-3.5 py-3 rounded-lg select-all focus:outline-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={copyUrl}
              className="py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-mono text-xs font-bold text-white transition active:scale-95 flex items-center justify-center gap-2"
            >
              {copied ? '✓ COPIED TO CLIPBOARD' : '📋 COPY FEED LINK'}
            </button>
            <a
              href={webcalUrl}
              className="py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              📅 ONE-TAP SUBSCRIBE (APPLE CALENDAR)
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}