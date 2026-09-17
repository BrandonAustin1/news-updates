'use client';

import { useState, useEffect } from 'react';

const ALL_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
];

const IMPACT_LEVELS = [
  { id: 'high', label: 'High Impact', icon: '🔴', activeBg: 'bg-red-500/20 border-red-500 text-red-300' },
  { id: 'medium', label: 'Medium Impact', icon: '🟠', activeBg: 'bg-amber-500/20 border-amber-500 text-amber-300' },
  { id: 'low', label: 'Low Impact', icon: '🟡', activeBg: 'bg-yellow-500/20 border-yellow-500 text-yellow-300' },
];

export default function CalendarDashboard() {
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['USD', 'GBP', 'EUR', 'JPY', 'CAD']);
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

  // Construct dynamic feed query URL
  const params = new URLSearchParams();
  if (selectedCurrencies.length > 0) {
    params.set('currencies', selectedCurrencies.join(','));
  }
  if (selectedImpacts.length > 0) {
    params.set('impacts', selectedImpacts.join(','));
  }
  params.set('group', groupEvents ? 'true' : 'false');

  const relativeFeedUrl = `/api/calendar?${params.toString()}`;
  const fullHttpsUrl = origin ? `${origin}${relativeFeedUrl}` : relativeFeedUrl;
  const webcalUrl = fullHttpsUrl.replace(/^https?:\/\//, 'webcal://');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullHttpsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      window.prompt('Copy feed link:', fullHttpsUrl);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              ⚡
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              News Updates Feed Generator
            </h1>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Live, primary-source economic releases with beat/miss badges for Apple Calendar.
          </p>
        </div>

        {/* Currency Selector */}
        <div className="space-y-3 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
              1. Currencies to Follow ({selectedCurrencies.length} Selected)
            </label>
            <div className="flex gap-2 text-xs">
              <button
                onClick={selectAllCurrencies}
                className="text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition"
              >
                All
              </button>
              <button
                onClick={selectCoreCurrencies}
                className="text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition"
              >
                Core 4
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
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-500/30 font-semibold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{curr.flag}</span>
                    <span>{curr.code}</span>
                  </div>
                  {isSelected ? (
                    <span className="text-xs bg-blue-500/30 text-blue-100 rounded-full px-1.5 py-0.5">✓</span>
                  ) : (
                    <span className="text-xs text-zinc-600">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Impact Tiers */}
        <div className="space-y-3 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl">
          <label className="text-sm font-semibold tracking-wide text-zinc-200 uppercase block">
            2. Impact Filter
          </label>
          <div className="grid grid-cols-3 gap-3">
            {IMPACT_LEVELS.map(tier => {
              const isSelected = selectedImpacts.includes(tier.id);
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => toggleImpact(tier.id)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? `${tier.activeBg} font-semibold ring-2 ring-white/10`
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <span>{tier.icon}</span>
                  <span>{tier.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grouping Toggle */}
        <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl">
          <div>
            <p className="text-sm font-semibold text-zinc-200">Cluster Simultaneous Releases</p>
            <p className="text-xs text-zinc-400">
              Groups concurrent reports (e.g. 13:30 CAD CPI metrics) into a single event card to avoid calendar clutter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGroupEvents(!groupEvents)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              groupEvents ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                groupEvents ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Output & Subscription Link */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <label className="text-sm font-semibold tracking-wide text-zinc-200 uppercase block">
            3. Your Custom Calendar Link
          </label>

          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
            <input
              type="text"
              readOnly
              value={fullHttpsUrl}
              className="w-full bg-transparent text-xs text-zinc-300 font-mono focus:outline-none select-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={copyToClipboard}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100'
              }`}
            >
              {copied ? (
                <>
                  <span>✓</span> Copied Link to Clipboard!
                </>
              ) : (
                <>
                  <span>📋</span> Copy Calendar URL
                </>
              )}
            </button>

            <a
              href={webcalUrl}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              <span>📅</span> Subscribe in Calendar App
            </a>
          </div>

          {/* Quick instructions */}
          <div className="border-t border-zinc-800 pt-4 text-xs text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-300">Quick Setup for Apple Calendar (iPhone & Mac):</p>
            <p>• <strong>Mac:</strong> Click "Subscribe in Calendar App" above → set Auto-refresh to <strong>Every 15 minutes</strong>.</p>
            <p>• <strong>iPhone:</strong> Copy Calendar URL → Settings → Apps → Calendar → Calendar Accounts → Add Subscribed Calendar → paste URL.</p>
          </div>
        </div>
      </div>
    </main>
  );
}