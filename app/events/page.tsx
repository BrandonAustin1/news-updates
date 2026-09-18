'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  country: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string;
  previous: string;
  actual: string;
  outcome: 'beat' | 'miss' | 'inline' | 'pending' | 'document' | 'upcoming';
}

const ALL_CURRENCIES = [
  { code: 'USD', flag: '🇺🇸' },
  { code: 'GBP', flag: '🇬🇧' },
  { code: 'EUR', flag: '🇪🇺' },
  { code: 'JPY', flag: '🇯🇵' },
  { code: 'CAD', flag: '🇨🇦' },
  { code: 'AUD', flag: '🇦🇺' },
  { code: 'NZD', flag: '🇳🇿' },
  { code: 'CHF', flag: '🇨🇭' },
];

export default function LiveEventsTerminal() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['USD', 'GBP', 'JPY', 'CAD']);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['high', 'medium']);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [, startTransition] = useTransition();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('currencies', selectedCurrencies.join(','));
      params.set('impacts', selectedImpacts.join(','));

      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 60_000);
    return () => clearInterval(interval);
  }, [selectedCurrencies, selectedImpacts]);

  const toggleCurrency = (code: string) => {
    startTransition(() => {
      setSelectedCurrencies(prev =>
        prev.includes(code)
          ? prev.length > 1 ? prev.filter(c => c !== code) : prev
          : [...prev, code]
      );
    });
  };

  const toggleImpact = (impact: string) => {
    startTransition(() => {
      setSelectedImpacts(prev =>
        prev.includes(impact)
          ? prev.length > 1 ? prev.filter(i => i !== impact) : prev
          : [...prev, impact]
      );
    });
  };

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedByDate: Record<string, CalendarEvent[]> = {};
  filteredEvents.forEach(e => {
    const d = new Date(e.date);
    const dayKey = isNaN(d.getTime())
      ? 'Unknown Date'
      : d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    if (!groupedByDate[dayKey]) groupedByDate[dayKey] = [];
    groupedByDate[dayKey].push(e);
  });

  return (
    <main className="min-h-screen bg-[#08090C] text-zinc-100 antialiased p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-800/80 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                MACRO LIVE TERMINAL
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Direct economic releases with algorithmic beat/miss calculations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 transition"
            >
              ← ICS Generator
            </Link>
            <button
              type="button"
              onClick={fetchEvents}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-bold transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>↻</span> {loading ? 'Fetching...' : 'Sync Data'}
            </button>
          </div>
        </header>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase text-zinc-500 mr-2">Currencies:</span>
            {ALL_CURRENCIES.map(c => {
              const active = selectedCurrencies.includes(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleCurrency(c.code)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition ${
                    active
                      ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedCurrencies(ALL_CURRENCIES.map(c => c.code))}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-mono ml-auto"
            >
              All
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-zinc-500 mr-2">Tiers:</span>
              {[
                { id: 'high', label: '🔴 High', activeStyle: 'border-red-500 bg-red-950/30 text-red-300' },
                { id: 'medium', label: '🟠 Medium', activeStyle: 'border-amber-500 bg-amber-950/30 text-amber-300' },
                { id: 'low', label: '⚪ Low', activeStyle: 'border-zinc-600 bg-zinc-800/40 text-zinc-300' },
              ].map(t => {
                const active = selectedImpacts.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleImpact(t.id)}
                    className={`px-3 py-1 rounded-md border text-xs font-mono transition ${
                      active ? t.activeStyle : 'border-zinc-800 bg-zinc-950/40 text-zinc-600 opacity-60'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter releases (e.g. CPI, Rates)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 w-full sm:w-64 font-mono"
              />
            </div>
          </div>
        </div>

        {loading && events.length === 0 ? (
          <div className="text-center py-20 font-mono text-zinc-500 text-sm">
            Connecting to economic data streams...
          </div>
        ) : Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-20 font-mono text-zinc-500 text-sm">
            No events match your current filter selection.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([dateStr, dayEvents]) => (
              <div key={dateStr} className="space-y-2">
                <div className="font-mono text-xs text-zinc-400 uppercase tracking-wider font-semibold px-1 flex items-center justify-between">
                  <span>📅 {dateStr}</span>
                  <span className="text-zinc-600">{dayEvents.length} Events</span>
                </div>

                <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/30">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-zinc-800/80 bg-zinc-950/60 text-zinc-400">
                          <th className="py-2.5 px-4">Time</th>
                          <th className="py-2.5 px-3">Asset</th>
                          <th className="py-2.5 px-4">Event Name</th>
                          <th className="py-2.5 px-3 text-center">Impact</th>
                          <th className="py-2.5 px-4 text-right">Actual</th>
                          <th className="py-2.5 px-4 text-right">Forecast</th>
                          <th className="py-2.5 px-4 text-right">Previous</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {dayEvents.map(ev => {
                          const timeStr = isNaN(new Date(ev.date).getTime())
                            ? '--:--'
                            : new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                          return (
                            <tr key={ev.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">{timeStr}</td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-zinc-200 font-bold">
                                  {ev.country}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-sans font-medium text-zinc-200 max-w-xs sm:max-w-md truncate">
                                {ev.title}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                {ev.impact === 'high' && <span className="text-red-400">🔴 High</span>}
                                {ev.impact === 'medium' && <span className="text-amber-400">🟠 Med</span>}
                                {ev.impact === 'low' && <span className="text-zinc-500">⚪ Low</span>}
                              </td>

                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                {ev.outcome === 'beat' && (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                                    {ev.actual} 🟢 ⬆️
                                  </span>
                                )}
                                {ev.outcome === 'miss' && (
                                  <span className="inline-flex items-center gap-1 text-red-400 font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30">
                                    {ev.actual} 🔴 ⬇️
                                  </span>
                                )}
                                {ev.outcome === 'inline' && (
                                  <span className="inline-flex items-center gap-1 text-zinc-300 font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                                    {ev.actual} ⚪
                                  </span>
                                )}
                                {ev.outcome === 'document' && (
                                  <span className="text-zinc-500 text-[11px] italic">Document</span>
                                )}
                                {ev.outcome === 'pending' && (
                                  <span className="text-amber-400 font-bold animate-pulse">Pending...</span>
                                )}
                                {ev.outcome === 'upcoming' && (
                                  <span className="text-zinc-600">Upcoming</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right text-zinc-400 whitespace-nowrap">
                                {ev.forecast}
                              </td>
                              <td className="py-3 px-4 text-right text-zinc-500 whitespace-nowrap">
                                {ev.previous}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="pt-4 border-t border-zinc-900 text-center text-xs font-mono text-zinc-600">
          Last synchronized: {lastRefreshed || 'Just now'} • Updates every 60 seconds automatically
        </footer>
      </div>
    </main>
  );
}
