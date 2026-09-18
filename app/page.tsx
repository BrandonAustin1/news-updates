'use client';

import { useState, useEffect } from 'react';

interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const ALL_CURRENCIES: CurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
];

const IMPACT_TIERS = [
  {
    id: 'high',
    label: 'High Impact',
    desc: 'Market movers: NFP, CPI, Central Bank Rate Decisions',
    dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    activeContainer: 'bg-red-950/40 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/50',
    activeBadge: 'bg-red-500/20 text-red-300 border-red-500/30',
    checkColor: 'bg-red-500 text-white',
  },
  {
    id: 'medium',
    label: 'Medium Impact',
    desc: 'Retail Sales, PMIs, Secondary Inflation metrics',
    dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    activeContainer: 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50',
    activeBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    checkColor: 'bg-amber-500 text-black',
  },
  {
    id: 'low',
    label: 'Low Impact',
    desc: 'Minor auctions, secondary indices, sentiment polls',
    dot: 'bg-zinc-400',
    activeContainer: 'bg-zinc-800/60 border-zinc-500 shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-zinc-400/40',
    activeBadge: 'bg-zinc-700/60 text-zinc-200 border-zinc-600',
    checkColor: 'bg-zinc-200 text-black',
  },
];

export default function CalendarTerminalDashboard() {
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([
    'USD',
    'GBP',
    'JPY',
    'CAD',
  ]);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['high', 'medium']);
  const [groupEvents, setGroupEvents] = useState<boolean>(true);
  const [origin, setOrigin] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const toggleCurrency = (code: string) => {
    setSelectedCurrencies(prev =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter(c => c !== code)
          : prev
        : [...prev, code]
    );
  };

  const toggleImpact = (id: string) => {
    setSelectedImpacts(prev =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter(i => i !== id)
          : prev
        : [...prev, id]
    );
  };

  const selectAllCurrencies = () => setSelectedCurrencies(ALL_CURRENCIES.map(c => c.code));
  const selectCoreCurrencies = () => setSelectedCurrencies(['USD', 'GBP', 'JPY', 'CAD']);

  // Dynamic Query String
  const params = new URLSearchParams();
  if (selectedCurrencies.length > 0) params.set('currencies', selectedCurrencies.join(','));
  if (selectedImpacts.length > 0) params.set('impacts', selectedImpacts.join(','));
  params.set('group', groupEvents ? 'true' : 'false');

  const relativeFeedUrl = `/api/calendar?${params.toString()}`;
  const fullHttpsUrl = origin ? `${origin}${relativeFeedUrl}` : relativeFeedUrl;
  const webcalUrl = fullHttpsUrl.replace(/^https?:\/\//, 'webcal://');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullHttpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy feed link:', fullHttpsUrl);
    }
  };

  return (
    <main className="min-h-screen bg-[#08090C] text-zinc-100 antialiased selection:bg-cyan-500 selection:text-black">
      {/* Top Terminal Status Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-400">
              ECONOMIC FEED ENGINE <span className="text-zinc-600">|</span> LIVE RFC 5545
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              {selectedCurrencies.length} CURRENCIES
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 uppercase">
              {selectedImpacts.length} TIERS
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Title & Description */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            News Updates Dispatcher
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Custom calendar feed generator parsing direct bureau figures (BLS, BoE, ONS, StatCan, ECB) with real-time Beat/Miss badges.
          </p>
        </div>

        {/* Section 1: Currencies */}
        <section className="bg-zinc-900/40 border border-zinc-800/70 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
            <div>
              <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-300">
                1. Select Monitored Currencies
              </h2>
              <p className="text-xs text-zinc-500">Click to include or exclude assets from your feed.</p>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-xs">
              <button
                type="button"
                onClick={selectCoreCurrencies}
                className="px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 transition active:scale-95"
              >
                Core 4 (USD/GBP/JPY/CAD)
              </button>
              <button
                type="button"
                onClick={selectAllCurrencies}
                className="px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 transition active:scale-95"
              >
                Select All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ALL_CURRENCIES.map(curr => {
              const isSelected = selectedCurrencies.includes(curr.code);
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => toggleCurrency(curr.code)}
                  className={`relative flex items-center justify-between p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-zinc-800/90 border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.12)] ring-1 ring-cyan-500/50'
                      : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl leading-none">{curr.flag}</span>
                    <div>
                      <div
                        className={`text-sm font-bold font-mono ${
                          isSelected ? 'text-white' : 'text-zinc-400'
                        }`}
                      >
                        {curr.code}
                      </div>
                      <div className="text-[10px] text-zinc-500 leading-tight">{curr.name}</div>
                    </div>
                  </div>

                  {/* High-visibility Checkbox Indicator */}
                  <div
                    className={`h-5 w-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-cyan-500 border-cyan-400 text-black font-black'
                        : 'border-zinc-700 bg-zinc-900/80 text-transparent'
                    }`}
                  >
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Impact Filter (Crystal Clear Active vs. Inactive States) */}
        <section className="bg-zinc-900/40 border border-zinc-800/70 rounded-2xl p-5 space-y-4">
          <div className="pb-2 border-b border-zinc-800/60">
            <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-300">
              2. Filter by Volatility Impact
            </h2>
            <p className="text-xs text-zinc-500">
              Active filters show a colored checkmark and glowing border. Unchecked filters are dimmed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {IMPACT_TIERS.map(tier => {
              const isSelected = selectedImpacts.includes(tier.id);
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => toggleImpact(tier.id)}
                  className={`group relative flex flex-col justify-between p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? tier.activeContainer
                      : 'bg-zinc-950/30 border-zinc-800/70 opacity-40 hover:opacity-75 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${tier.dot}`} />
                      <span
                        className={`text-sm font-bold tracking-wide ${
                          isSelected ? 'text-white' : 'text-zinc-400'
                        }`}
                      >
                        {tier.label}
                      </span>
                    </div>

                    {/* Dedicated Checkbox Box */}
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? `${tier.checkColor} font-bold shadow-sm`
                          : 'border-zinc-700 bg-zinc-900 text-transparent'
                      }`}
                    >
                      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed min-h-[32px]">
                    {tier.desc}
                  </p>

                  <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-zinc-500">Status</span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        isSelected
                          ? tier.activeBadge
                          : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                      }`}
                    >
                      {isSelected ? 'ACTIVE • FEED INCLUDED' : 'MUTED / EXCLUDED'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 3: Event Clustering & Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clustering Toggle */}
          <div className="bg-zinc-900/40 border border-zinc-800/70 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-300">
                  Cluster Simultaneous Drops
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                    groupEvents
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                  }`}
                >
                  {groupEvents ? 'ENABLED' : 'INDIVIDUAL'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Groups concurrent releases (e.g. 13:30 CAD CPI m/m, Trimmed, and Median) into a single 5-minute calendar entry to keep your schedule uncluttered.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setGroupEvents(!groupEvents)}
              className="mt-4 w-full py-2.5 px-3 rounded-xl border border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700/80 text-xs font-mono font-medium text-zinc-200 flex items-center justify-between transition"
            >
              <span>Toggle Multi-Release Grouping</span>
              <span className="text-cyan-400 font-bold">{groupEvents ? '[ON]' : '[OFF]'}</span>
            </button>
          </div>

          {/* Live Apple Calendar Simulation Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/70 rounded-2xl p-5">
            <span className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-400 block mb-2">
              Live Feed Entry Preview (In Apple Calendar)
            </span>
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 font-sans space-y-1.5 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-zinc-100">
                  🔴 [{selectedCurrencies[0] || 'USD'}] Rate Decision {groupEvents ? '(+2 releases)' : ''}
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 pl-4 border-l border-zinc-800 space-y-0.5">
                <div>• Actual: 4.50% 🟢 ⬆️ Beat</div>
                <div className="text-zinc-500">• Forecast: 4.25% | Previous: 4.25%</div>
                <div className="text-emerald-400 font-semibold pt-1">• Live Primary Source Verified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Subscription & Copy Station */}
        <section className="bg-gradient-to-b from-zinc-900/80 to-zinc-950 border border-cyan-500/30 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <span className="text-xs font-bold font-mono tracking-widest uppercase text-cyan-400 block mb-1">
              3. Feed Subscription Endpoint
            </span>
            <h2 className="text-lg font-bold text-white">Subscribe & Synchronize</h2>
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={fullHttpsUrl}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-cyan-300 select-all focus:outline-none focus:border-cyan-500/50 shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={copyToClipboard}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-mono font-bold tracking-wide uppercase border transition-all flex items-center justify-center gap-2 active:scale-95 ${
                copied
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-zinc-800 hover:bg-zinc-700/80 border-zinc-700 text-zinc-100 hover:border-zinc-600'
              }`}
            >
              {copied ? (
                <>
                  <span>✓</span> COPIED FEED URL TO CLIPBOARD
                </>
              ) : (
                <>
                  <span>📋</span> COPY CALENDAR FEED URL
                </>
              )}
            </button>

            <a
              href={webcalUrl}
              className="w-full py-3.5 px-4 rounded-xl text-xs font-mono font-bold tracking-wide uppercase bg-cyan-600 hover:bg-cyan-500 text-black transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.25)] active:scale-95"
            >
              <span>📅</span> ONE-TAP SUBSCRIBE (APPLE CALENDAR)
            </a>
          </div>

          <div className="border-t border-zinc-800/80 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-zinc-400 font-sans">
            <div>
              <span className="font-semibold text-zinc-300">Mac Calendar Setup:</span>
              <p>Click "One-Tap Subscribe". In the prompt, set Auto-refresh to <strong>Every 15 minutes</strong>.</p>
            </div>
            <div>
              <span className="font-semibold text-zinc-300">iPhone Setup:</span>
              <p>Copy URL → Settings → Apps → Calendar → Calendar Accounts → Add Subscribed Calendar → Paste.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}