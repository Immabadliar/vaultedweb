import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  chicago: { latitude: 41.8781, longitude: -87.6298 },
  seattle: { latitude: 47.6062, longitude: -122.3321 },
  denver: { latitude: 39.7392, longitude: -104.9903 },
  phoenix: { latitude: 33.4484, longitude: -112.0740 }
};

type FeedItem = {
  text: string;
  city: string;
  happened_at?: string;
};

const KEYWORDS: Array<{ match: string; type: 'police' | 'security' | 'alarm' | 'safe' }> = [
  { match: 'alarm', type: 'alarm' },
  { match: 'dispatch', type: 'police' },
  { match: 'suspicious', type: 'security' },
  { match: 'officer', type: 'police' }
];

function classify(text: string): 'police' | 'security' | 'alarm' | 'safe' {
  const lower = text.toLowerCase();
  const hit = KEYWORDS.find((entry) => lower.includes(entry.match));
  return hit?.type ?? 'safe';
}

function normalizeCity(city: string) {
  const lower = city.toLowerCase();
  return CITY_COORDS[lower] ? lower : 'chicago';
}

async function fetchPublicFeed(): Promise<FeedItem[]> {
  const endpoints = [
    'https://data.seattle.gov/resource/kzjm-xkqj.json?$limit=5',
    'https://data.cityofchicago.org/resource/6zsd-86xi.json?$limit=5'
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      if (!response.ok) continue;
      const json = await response.json();
      if (!Array.isArray(json) || json.length === 0) continue;

      if (url.includes('seattle')) {
        return json.map((item) => ({
          text: item.initial_type_description || item.event_clearance_description || 'dispatch activity',
          city: 'seattle',
          happened_at: item.event_clearance_date
        }));
      }

      if (url.includes('chicago')) {
        return json.map((item) => ({
          text: item.primary_type || item.description || 'dispatch activity',
          city: 'chicago',
          happened_at: item.date
        }));
      }
    } catch {
      // Continue until we find a working public feed.
    }
  }

  const samples = [
    'alarm call near warehouse district',
    'officer dispatch near rail yard',
    'suspicious activity near utility tunnel',
    'area currently safe after response'
  ];

  return samples.map((text, i) => ({
    text,
    city: i % 2 ? 'denver' : 'chicago',
    happened_at: new Date().toISOString()
  }));
}

async function insertScannerAlerts(items: FeedItem[]) {
  const payload = items.slice(0, 10).map((item) => {
    const city = normalizeCity(item.city);
    const base = CITY_COORDS[city];

    return {
      user_id: null,
      type: classify(item.text),
      latitude: base.latitude + (Math.random() - 0.5) * 0.03,
      longitude: base.longitude + (Math.random() - 0.5) * 0.03,
      note: item.text,
      source: 'scanner',
      created_at: item.happened_at ?? new Date().toISOString()
    };
  });

  const { data, error } = await supabase.from('alerts').insert(payload).select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const feed = await fetchPublicFeed();

    if (body?.mode === 'snapshot') {
      return new Response(JSON.stringify({ events: feed.slice(0, 10) }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const inserted = await insertScannerAlerts(feed);

    return new Response(JSON.stringify({ ok: true, inserted }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
