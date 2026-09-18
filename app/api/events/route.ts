import { NextRequest, NextResponse } from 'next/server';
import { resolvePrimaryActual } from '@/lib/primarySources';

export const dynamic = 'force-dynamic';

interface RawEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

function parseEconValue(raw?: string): number | null {
  if (!raw || raw.trim() === '' || raw.toLowerCase() === 'n/a') return null;
  const match = raw.replace(/,/g, '').trim().match(/^([-+]?[0-9]*\.?[0-9]+)\s*([KkMmBb%]?)/);
  if (!match) return null;
  let val = parseFloat(match[1]);
  if (isNaN(val)) return null;
  const suffix = match[2]?.toUpperCase();
  if (suffix === 'K') val *= 1_000;
  if (suffix === 'M') val *= 1_000_000;
  if (suffix === 'B') val *= 1_000_000_000;
  return val;
}

const INVERTED_METRICS = ['unemployment', 'jobless', 'claimant', 'deficit', 'inventories'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const currencies = (searchParams.get('currencies') || 'USD,GBP,JPY,CAD,EUR,AUD,NZD,CHF')
    .toUpperCase()
    .split(',');
  const impacts = (searchParams.get('impacts') || 'high,medium,low')
    .toLowerCase()
    .split(',');

  try {
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      Accept: 'application/json',
    };

    const [thisWeekRes, nextWeekRes] = await Promise.all([
      fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', { headers: fetchHeaders, cache: 'no-store' }),
      fetch('https://nfs.faireconomy.media/ff_calendar_nextweek.json', { headers: fetchHeaders, cache: 'no-store' }),
    ]);

    const thisWeek: RawEvent[] = thisWeekRes.ok ? await thisWeekRes.json() : [];
    const nextWeek: RawEvent[] = nextWeekRes.ok ? await nextWeekRes.json() : [];
    const all = [...thisWeek, ...nextWeek];

    const filtered = all.filter(e =>
      currencies.includes(e.country?.toUpperCase()) &&
      impacts.includes(e.impact?.toLowerCase())
    );

    const now = Date.now();

    const enriched = await Promise.all(
      filtered.map(async ev => {
        let actual = ev.actual?.trim() || '';
        const isPast = new Date(ev.date).getTime() <= now;

        if (!actual && isPast) {
          const resolved = await resolvePrimaryActual(ev.title, ev.country);
          if (resolved) actual = resolved;
        }

        const t = ev.title.toLowerCase();
        const isNonData =
          t.includes('statement') ||
          t.includes('projection') ||
          t.includes('minutes') ||
          t.includes('speaks') ||
          t.includes('testifies') ||
          t.includes('holiday') ||
          ((!ev.forecast || ev.forecast === 'N/A') && (!ev.previous || ev.previous === 'N/A'));

        let outcome: 'beat' | 'miss' | 'inline' | 'pending' | 'document' | 'upcoming' = 'upcoming';

        if (!isPast) {
          outcome = 'upcoming';
        } else if (isNonData) {
          outcome = 'document';
        } else if (!actual) {
          outcome = 'pending';
        } else {
          const aNum = parseEconValue(actual);
          const fNum = parseEconValue(ev.forecast);

          if (aNum !== null && fNum !== null) {
            const diff = aNum - fNum;
            if (Math.abs(diff) < 0.0001) {
              outcome = 'inline';
            } else {
              const isInverted = INVERTED_METRICS.some(k => t.includes(k));
              const isBeat = isInverted ? diff < 0 : diff > 0;
              outcome = isBeat ? 'beat' : 'miss';
            }
          } else {
            outcome = 'inline';
          }
        }

        return {
          id: `${ev.country}-${ev.title}-${ev.date}`,
          title: ev.title,
          country: ev.country,
          date: ev.date,
          impact: ev.impact.toLowerCase(),
          forecast: ev.forecast || '-',
          previous: ev.previous || '-',
          actual: actual || (outcome === 'document' ? 'Statement/Speech' : outcome === 'upcoming' ? 'Upcoming' : 'Pending'),
          outcome,
        };
      })
    );

    enriched.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(enriched, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
