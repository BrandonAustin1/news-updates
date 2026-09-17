import { NextRequest, NextResponse } from 'next/server';
import { resolvePrimaryActual } from '@/lib/primarySources';

export const dynamic = 'force-dynamic';

interface EventItem {
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
  const suffix = match[2].toUpperCase();
  if (suffix === 'K') val *= 1_000;
  if (suffix === 'M') val *= 1_000_000;
  if (suffix === 'B') val *= 1_000_000_000;
  return val;
}

const INVERTED_METRICS = ['unemployment', 'jobless', 'claimant', 'deficit', 'inventories'];

function formatActualWithDeviation(title: string, actual?: string, forecast?: string, previous?: string): string {
  const t = title.toLowerCase();
  const isNonData =
    t.includes('statement') ||
    t.includes('projection') ||
    t.includes('minutes') ||
    t.includes('speaks') ||
    t.includes('testifies') ||
    t.includes('press conference') ||
    ((!forecast || forecast === 'N/A') && (!previous || previous === 'N/A'));

  if (isNonData) {
    return 'Status: Completed (Statement / Document)';
  }

  if (!actual || actual.trim() === '') return 'Actual: Pending';

  const aNum = parseEconValue(actual);
  const fNum = parseEconValue(forecast);
  if (aNum === null || fNum === null) return `Actual: ${actual}`;

  const diff = aNum - fNum;
  if (Math.abs(diff) < 0.0001) return `Actual: ${actual} ⚪ In Line`;

  const isInverted = INVERTED_METRICS.some(k => t.includes(k));
  const isBeat = isInverted ? diff < 0 : diff > 0;
  return isBeat ? `Actual: ${actual} 🟢 ⬆️ Beat` : `Actual: ${actual} 🔴 ⬇️ Miss`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const currencies = (searchParams.get('currencies') || 'USD,GBP,JPY,CAD,EUR,AUD,NZD,CHF')
    .toUpperCase()
    .split(',');
  const impacts = (searchParams.get('impacts') || 'High,Medium')
    .split(',')
    .map(i => i.toLowerCase());
  const shouldGroup = searchParams.get('group') !== 'false';

  try {
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      Accept: 'application/json',
    };

    const [thisWeekRes, nextWeekRes] = await Promise.all([
      fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', { headers: fetchHeaders, cache: 'no-store' }),
      fetch('https://nfs.faireconomy.media/ff_calendar_nextweek.json', { headers: fetchHeaders, cache: 'no-store' }),
    ]);

    const thisWeek: EventItem[] = thisWeekRes.ok ? await thisWeekRes.json() : [];
    const nextWeek: EventItem[] = nextWeekRes.ok ? await nextWeekRes.json() : [];
    const rawEvents = [...thisWeek, ...nextWeek];

    const filtered = rawEvents.filter(e =>
      currencies.includes(e.country?.toUpperCase()) && impacts.includes(e.impact?.toLowerCase())
    );

    const now = Date.now();
    const enrichedEvents = await Promise.all(
      filtered.map(async ev => {
        let liveActual = ev.actual;
        if (!liveActual && new Date(ev.date).getTime() <= now) {
          const primaryVal = await resolvePrimaryActual(ev.title, ev.country);
          if (primaryVal) liveActual = primaryVal;
        }
        return { ...ev, actual: liveActual };
      })
    );

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NewsUpdates//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:News Updates',
      'X-WR-TIMEZONE:UTC',
      'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
      'X-PUBLISHED-TTL:PT15M',
    ];

    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const nowIso = fmt(new Date());

    if (shouldGroup) {
      const groups = new Map<string, { currency: string; date: Date; events: EventItem[] }>();
      for (const ev of enrichedEvents) {
        const d = new Date(ev.date);
        if (isNaN(d.getTime())) continue;
        const key = `${ev.country.toUpperCase()}_${d.getTime()}`;
        if (!groups.has(key)) groups.set(key, { currency: ev.country.toUpperCase(), date: d, events: [] });
        groups.get(key)!.events.push(ev);
      }

      for (const [key, group] of groups.entries()) {
        const start = group.date;
        const end = new Date(start.getTime() + 5 * 60 * 1000);
        const hasHigh = group.events.some(e => e.impact.toLowerCase() === 'high');
        const icon = hasHigh ? '🔴' : '🟠';

        let summary = `${icon} [${group.currency}] ${group.events[0].title}`;
        if (group.events.length > 1) summary += ` (+${group.events.length - 1} releases)`;

        const uid = `group-${key}@econfeed.local`;
        const desc = group.events
          .map((e, idx) => {
            const tag = e.impact.toLowerCase() === 'high' ? '🔴 High' : '🟠 Medium';
            return [
              `${idx + 1}. ${e.title} [${tag}]`,
              `   • ${formatActualWithDeviation(e.title, e.actual, e.forecast, e.previous)}`,
              `   • Forecast: ${e.forecast || 'N/A'} | Previous: ${e.previous || 'N/A'}`,
            ].join('\\n');
          })
          .join('\\n-------------------------\\n');

        const hasActual = group.events.some(e => Boolean(e.actual?.trim()));

        lines.push(
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${nowIso}`,
          `LAST-MODIFIED:${nowIso}`,
          `SEQUENCE:${hasActual ? 2 : 1}`,
          `DTSTART:${fmt(start)}`,
          `DTEND:${fmt(end)}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${desc}`,
          'TRANSP:TRANSPARENT',
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      }
    } else {
      for (const ev of enrichedEvents) {
        const start = new Date(ev.date);
        if (isNaN(start.getTime())) continue;
        const end = new Date(start.getTime() + 5 * 60 * 1000);
        const icon = ev.impact.toLowerCase() === 'high' ? '🔴' : '🟠';
        const uid = `single-${ev.country}-${ev.title}-${start.getTime()}`.replace(/[^a-zA-Z0-9-]/g, '_');

        const desc = [
          `Impact: ${ev.impact}`,
          `Forecast: ${ev.forecast || 'N/A'}`,
          `Previous: ${ev.previous || 'N/A'}`,
          formatActualWithDeviation(ev.title, ev.actual, ev.forecast, ev.previous),
        ].join('\\n');

        const hasActual = Boolean(ev.actual?.trim());

        lines.push(
          'BEGIN:VEVENT',
          `UID:${uid}@econfeed.local`,
          `DTSTAMP:${nowIso}`,
          `LAST-MODIFIED:${nowIso}`,
          `SEQUENCE:${hasActual ? 2 : 1}`,
          `DTSTART:${fmt(start)}`,
          `DTEND:${fmt(end)}`,
          `SUMMARY:${icon} [${ev.country}] ${ev.title}`,
          `DESCRIPTION:${desc}`,
          'TRANSP:TRANSPARENT',
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      }
    }

    lines.push('END:VCALENDAR');

    return new NextResponse(lines.join('\r\n'), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="calendar.ics"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch {
    return new NextResponse('Error generating calendar feed', { status: 500 });
  }
}