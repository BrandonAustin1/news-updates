'use client';

import { useState } from 'react';

const ALL_CURRENCIES = ['USD', 'GBP', 'JPY', 'EUR', 'CAD', 'AUD', 'NZD', 'CHF'];
const ALL_IMPACTS = [
  { id: 'High', label: 'High Impact', icon: '🔴' },
  { id: 'Medium', label: 'Medium Impact', icon: '🟠' },
];

export default function Home() {
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['USD', 'GBP', 'JPY']);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['High', 'Medium']);
  const [copied, setCopied] = useState(false);

  const toggleCurrency = (c: string) => {
    setSelectedCurrencies(prev =>
      prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
    );
  };

  const toggleImpact = (i: string) => {
    setSelectedImpacts(prev =>
      prev.includes(i) ? prev.filter(item => item !== i) : [...prev, i]
    );
  };

  const queryString = `currencies=${selectedCurrencies.join(',')}&impacts=${selectedImpacts.join(',')}&group=true`;
  const httpFeedUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar?${queryString}`
    : `/api/calendar?${queryString}`;
  const webcalUrl = httpFeedUrl.replace(/^https?:\/\//, 'webcal://');

  const copyUrl = () => {
    navigator.clipboard.writeText(httpFeedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            📊 News Updates
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time economic news synced directly from official statistical bureaus into iOS Calendar.
          </p>
        </div>

        {/* Currency Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Currencies</label>
          <div className="grid grid-cols-4 gap-2">
            {ALL_CURRENCIES.map(c => {
              const active = selectedCurrencies.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCurrency(c)}
                  className={`py-2 px-3 text-sm font-semibold rounded-lg border transition-all ${
                    active
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Impact Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Impact Folders</label>
          <div className="flex gap-3">
            {ALL_IMPACTS.map(imp => {
              const active = selectedImpacts.includes(imp.id);
              return (
                <button
                  key={imp.id}
                  onClick={() => toggleImpact(imp.id)}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    active
                      ? 'bg-zinc-800 border-zinc-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800/40'
                  }`}
                >
                  <span>{imp.icon}</span>
                  <span>{imp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subscription Links */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <a
            href={webcalUrl}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
          >
            📅 Subscribe on iOS Calendar
          </a>

          <button
            onClick={copyUrl}
            className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl border border-zinc-700 transition-all"
          >
            {copied ? '✓ Feed URL Copied' : 'Copy Feed Subscription Link'}
          </button>
        </div>
      </div>
    </main>
  );
}