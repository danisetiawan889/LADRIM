import { NextRequest, NextResponse } from 'next/server';

interface PlaceResult {
  title: string;
  subtitle: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const CC_MAP: Record<string, string> = {
  Indonesia: 'id',
  Malaysia: 'my',
  Singapore: 'sg',
};

const STATE_TO_ENGLISH: Record<string, string> = {
  // Indonesia
  aceh: 'Aceh',
  bali: 'Bali',
  'bangka belitung': 'Bangka Belitung Islands',
  'kepulauan bangka belitung': 'Bangka Belitung Islands',
  'bangka belitung islands': 'Bangka Belitung Islands',
  banten: 'Banten',
  bengkulu: 'Bengkulu',
  'di yogyakarta': 'Yogyakarta',
  'daerah istimewa yogyakarta': 'Yogyakarta',
  yogyakarta: 'Yogyakarta',
  'dki jakarta': 'Jakarta',
  'daerah khusus ibukota jakarta': 'Jakarta',
  jakarta: 'Jakarta',
  gorontalo: 'Gorontalo',
  jambi: 'Jambi',
  'jawa barat': 'West Java',
  'west java': 'West Java',
  'jawa tengah': 'Central Java',
  'central java': 'Central Java',
  'jawa timur': 'East Java',
  'east java': 'East Java',
  'kalimantan barat': 'West Kalimantan',
  'west kalimantan': 'West Kalimantan',
  'kalimantan selatan': 'South Kalimantan',
  'south kalimantan': 'South Kalimantan',
  'kalimantan tengah': 'Central Kalimantan',
  'central kalimantan': 'Central Kalimantan',
  'kalimantan timur': 'East Kalimantan',
  'east kalimantan': 'East Kalimantan',
  'kalimantan utara': 'North Kalimantan',
  'north kalimantan': 'North Kalimantan',
  'kepulauan riau': 'Riau Islands',
  'riau islands': 'Riau Islands',
  lampung: 'Lampung',
  maluku: 'Maluku',
  'maluku utara': 'North Maluku',
  'north maluku': 'North Maluku',
  'nusa tenggara barat': 'West Nusa Tenggara',
  'west nusa tenggara': 'West Nusa Tenggara',
  'nusa tenggara timur': 'East Nusa Tenggara',
  'east nusa tenggara': 'East Nusa Tenggara',
  papua: 'Papua',
  'papua barat': 'West Papua',
  'west papua': 'West Papua',
  'papua barat daya': 'Southwest Papua',
  'southwest papua': 'Southwest Papua',
  'papua pegunungan': 'Highland Papua',
  'highland papua': 'Highland Papua',
  'papua selatan': 'South Papua',
  'south papua': 'South Papua',
  'papua tengah': 'Central Papua',
  'central papua': 'Central Papua',
  riau: 'Riau',
  'sulawesi barat': 'West Sulawesi',
  'west sulawesi': 'West Sulawesi',
  'sulawesi selatan': 'South Sulawesi',
  'south sulawesi': 'South Sulawesi',
  'sulawesi tengah': 'Central Sulawesi',
  'central sulawesi': 'Central Sulawesi',
  'sulawesi tenggara': 'Southeast Sulawesi',
  'southeast sulawesi': 'Southeast Sulawesi',
  'sulawesi utara': 'North Sulawesi',
  'north sulawesi': 'North Sulawesi',
  'sumatera barat': 'West Sumatra',
  'west sumatra': 'West Sumatra',
  'sumatera selatan': 'South Sumatra',
  'south sumatra': 'South Sumatra',
  'sumatera utara': 'North Sumatra',
  'north sumatra': 'North Sumatra',

  // Malaysia
  johor: 'Johor',
  kedah: 'Kedah',
  kelantan: 'Kelantan',
  melaka: 'Malacca',
  malacca: 'Malacca',
  'negeri sembilan': 'Negeri Sembilan',
  pahang: 'Pahang',
  perak: 'Perak',
  perlis: 'Perlis',
  'pulau pinang': 'Penang',
  penang: 'Penang',
  sabah: 'Sabah',
  sarawak: 'Sarawak',
  selangor: 'Selangor',
  terengganu: 'Terengganu',
  'wilayah persekutuan kuala lumpur': 'Kuala Lumpur',
  'kuala lumpur': 'Kuala Lumpur',
  'wilayah persekutuan labuan': 'Labuan',
  labuan: 'Labuan',
  'wilayah persekutuan putrajaya': 'Putrajaya',
  putrajaya: 'Putrajaya',
};

function toEnglishState(rawState: string, rawCity?: string): string {
  if (!rawState) {
    if (rawCity && /jakarta/i.test(rawCity)) return 'Jakarta';
    return '';
  }
  const trimmed = rawState.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'jawa' && rawCity && /jakarta/i.test(rawCity)) {
    return 'Jakarta';
  }
  if (STATE_TO_ENGLISH[lower]) {
    return STATE_TO_ENGLISH[lower];
  }
  for (const [key, val] of Object.entries(STATE_TO_ENGLISH)) {
    if (lower.includes(key)) {
      return val;
    }
  }
  return trimmed;
}

function cleanCity(rawCity: string): string {
  if (!rawCity) return '';
  let city = rawCity.trim();
  if (/^(dki\s+jakarta|daerah\s+khusus\s+ibukota\s+jakarta)$/i.test(city)) {
    return 'Jakarta';
  }
  city = city.replace(
    /^(kabupaten\s+administrasi|kabupaten|kota\s+administrasi|kota\s+adm\.?|kota|kab\.?|kecamatan|kec\.?|desa|kelurahan|kel\.?)\s+/i,
    ''
  );
  if (/^jakarta\s+selatan$/i.test(city)) return 'South Jakarta';
  if (/^jakarta\s+pusat$/i.test(city)) return 'Central Jakarta';
  if (/^jakarta\s+barat$/i.test(city)) return 'West Jakarta';
  if (/^jakarta\s+timur$/i.test(city)) return 'East Jakarta';
  if (/^jakarta\s+utara$/i.test(city)) return 'North Jakarta';
  if (/^(dki\s+jakarta|daerah\s+khusus\s+ibukota\s+jakarta)$/i.test(city)) return 'Jakarta';
  return city;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const country = searchParams.get('country') || 'Indonesia';

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const cc = CC_MAP[country] || 'id';
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

    // 1. OPTIONAL GOOGLE PLACES API (If API key is configured by user)
    if (googleApiKey) {
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          q
        )}&components=country:${cc}&key=${googleApiKey}`;
        const gRes = await fetch(googleUrl, { signal: AbortSignal.timeout(3500) });
        if (gRes.ok) {
          const gData = await gRes.json();
          if (Array.isArray(gData.predictions) && gData.predictions.length > 0) {
            const googleResults: PlaceResult[] = gData.predictions.slice(0, 8).map((p: any) => {
              const mainText = p.structured_formatting?.main_text || p.description.split(',')[0].trim();
              const secondaryText = p.structured_formatting?.secondary_text || '';
              const parts = (secondaryText || p.description).split(',').map((s: string) => s.trim());
              const rawCity = parts[0] || (country === 'Singapore' ? 'Singapore' : '');
              const rawState = parts[1] || '';
              return {
                title: mainText,
                subtitle: p.description,
                addressLine1: mainText,
                city: cleanCity(rawCity),
                state: toEnglishState(rawState),
                postalCode: '',
                country: country,
              };
            });
            return NextResponse.json(
              { results: googleResults, source: 'google' },
              { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
            );
          }
        }
      } catch {
        // Fallback gracefully to OpenStreetMap hybrid
      }
    }

    // 2. HIGH-PERFORMANCE HYBRID SEARCH: Nominatim + Photon OpenStreetMap
    const coordsByCountry: Record<string, { lat: number; lon: number }> = {
      Singapore: { lat: 1.3521, lon: 103.8198 },
      Malaysia: { lat: 4.2105, lon: 101.9758 },
      Indonesia: { lat: -6.2088, lon: 106.8456 },
    };
    const target = coordsByCountry[country] || coordsByCountry['Indonesia'];

    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      q
    )}&lat=${target.lat}&lon=${target.lon}&limit=8`;
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&addressdetails=1&countrycodes=${cc}&limit=8`;

    const [nominatimPromise, photonPromise] = await Promise.allSettled([
      fetch(nominatimUrl, {
        signal: AbortSignal.timeout(3500),
        headers: { 'User-Agent': 'LadrimEcommerceApp/1.0', Accept: 'application/json' },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(photonUrl, {
        signal: AbortSignal.timeout(3500),
        headers: { Accept: 'application/json' },
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    const results: PlaceResult[] = [];
    const seenTitles = new Set<string>();

    // Process Nominatim results first (rich detailed hierarchy: road, suburb, county, postcode)
    if (nominatimPromise.status === 'fulfilled' && Array.isArray(nominatimPromise.value)) {
      for (const item of nominatimPromise.value) {
        const addr = item.address || {};
        const title =
          item.name ||
          addr.amenity ||
          addr.shop ||
          addr.building ||
          addr.road ||
          item.display_name.split(',')[0].trim();

        let rawCity =
          addr.county ||
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.city_district ||
          '';

        if (country === 'Singapore') {
          rawCity = 'Singapore';
        } else if (country === 'Indonesia') {
          if (addr.county && (/^(kabupaten|kota|kab\.?)\s+/i.test(addr.county) || !rawCity || addr.village)) {
            rawCity = addr.county;
          }
        }

        const city = cleanCity(rawCity);
        const state = toEnglishState(addr.state || '', rawCity);
        const postalCode = addr.postcode || '';

        const cleanKey = `${title.toLowerCase().trim()}__${city.toLowerCase().trim()}__${postalCode.trim()}`;
        if (!title || seenTitles.has(cleanKey)) continue;
        seenTitles.add(cleanKey);

        const subtitle = [
          addr.road && addr.road !== title ? addr.road : '',
          addr.suburb || addr.village || addr.neighbourhood,
          city && city !== title ? city : '',
          state && state !== city ? state : '',
          postalCode,
        ]
          .filter(Boolean)
          .join(', ');

        const addressLine1 = [addr.house_number, addr.road || title].filter(Boolean).join(' ') || title;

        results.push({
          title,
          subtitle: subtitle || item.display_name,
          addressLine1,
          city,
          state,
          postalCode,
          country: country,
        });
      }
    }

    // Process Photon results to fill in POIs and streets
    if (photonPromise.status === 'fulfilled' && photonPromise.value?.features) {
      for (const f of photonPromise.value.features) {
        const p = f.properties || {};
        if (p.countrycode && p.countrycode.toLowerCase() !== cc.toUpperCase() && p.countrycode.toLowerCase() !== cc) {
          continue;
        }

        const title = p.name || p.street || '';
        if (!title) continue;

        const streetPart =
          p.street && p.street !== title
            ? `${p.housenumber ? p.housenumber + ' ' : ''}${p.street}`
            : '';

        let resolvedCity = p.city || '';
        if (country === 'Singapore') {
          resolvedCity = 'Singapore';
        } else if (country === 'Indonesia') {
          const isVillageOrHamlet = p.osm_value === 'village' || p.osm_value === 'hamlet' || p.type === 'district';
          const countyHasKabOrKota = p.county && /^(kabupaten|kota|kab\.?)\s+/i.test(p.county);
          const cityIsDesa = resolvedCity && /(desa|kelurahan|kecamatan)\s+/i.test(resolvedCity);
          const cityMatchesTitle = resolvedCity && resolvedCity.toLowerCase() === title.toLowerCase();

          if (p.county && (countyHasKabOrKota || isVillageOrHamlet || cityIsDesa || cityMatchesTitle || !resolvedCity)) {
            resolvedCity = p.county;
          }
        } else if (!resolvedCity) {
          resolvedCity = p.town || p.county || '';
        }

        const city = cleanCity(resolvedCity);
        const state = toEnglishState(p.state || '', resolvedCity);
        const postalCode = p.postcode || '';

        const cleanKey = `${title.toLowerCase().trim()}__${city.toLowerCase().trim()}__${postalCode.trim()}`;
        if (seenTitles.has(cleanKey)) continue;
        seenTitles.add(cleanKey);

        const subtitleParts = [
          streetPart,
          p.district || p.locality,
          city && city !== title ? city : '',
          state && state !== city ? state : '',
          postalCode,
        ].filter(Boolean);

        const addressLine1 =
          [p.housenumber, p.street || title].filter(Boolean).join(' ') || title;

        results.push({
          title,
          subtitle: subtitleParts.join(', '),
          addressLine1,
          city,
          state,
          postalCode,
          country: country,
        });
      }
    }

    return NextResponse.json(
      { results: results.slice(0, 8), source: 'hybrid_osm' },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch {
    return NextResponse.json({ results: [] });
  }
}
