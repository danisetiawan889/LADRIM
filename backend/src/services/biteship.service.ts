import { env } from '../config/env';

const BITESHIP_BASE_URL = 'https://api.biteship.com/v1';

export interface BiteshipRateItem {
  name: string;
  value: number;
  quantity: number;
  weight: number; // in grams
}

export interface BiteshipRateResult {
  courier_name: string;
  courier_code: string;
  courier_service_name: string;
  courier_service_code: string;
  description: string;
  duration: string;
  price: number;
  type: string;
}

/**
 * Fetch available courier services from Biteship
 */
export async function getBiteshipCouriers() {
  try {
    const res = await fetch(`${BITESHIP_BASE_URL}/couriers`, {
      headers: {
        Authorization: env.BITESHIP_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch couriers: ${res.statusText}`);
    }

    const data = await res.json();
    return data.couriers || [];
  } catch (err: any) {
    console.error('Biteship getCouriers error:', err.message);
    return [];
  }
}

/**
 * Calculate shipping rates from Biteship API
 * Falls back to standardized rates if sandbox balance is empty
 */
export async function getBiteshipRates(params: {
  originPostalCode?: number;
  destinationPostalCode: number;
  couriers?: string;
  items: BiteshipRateItem[];
}): Promise<BiteshipRateResult[]> {
  const originPostal = params.originPostalCode || 12440; // Default warehouse: South Jakarta
  const couriersList = params.couriers || 'jne,sicepat,jnt,anteraja';

  try {
    const res = await fetch(`${BITESHIP_BASE_URL}/rates/couriers`, {
      method: 'POST',
      headers: {
        Authorization: env.BITESHIP_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin_postal_code: originPostal,
        destination_postal_code: params.destinationPostalCode,
        couriers: couriersList,
        items: params.items.map((it) => ({
          name: it.name,
          value: it.value,
          quantity: it.quantity,
          weight: it.weight || 500,
        })),
      }),
    });

    const data = await res.json();

    if (res.ok && data.pricing && Array.isArray(data.pricing)) {
      return data.pricing.map((p: any) => ({
        courier_name: p.courier_name,
        courier_code: p.courier_code,
        courier_service_name: p.courier_service_name,
        courier_service_code: p.courier_service_code,
        description: p.description,
        duration: p.duration,
        price: p.price,
        type: p.type,
      }));
    }

    // If sandbox account reports low balance, return standard dynamic matrix so checkout remains smooth
    console.warn('Biteship rate API responded with:', data.error || 'fallback invoked');
    const totalWeight = params.items.reduce((sum, it) => sum + (it.weight || 500) * it.quantity, 0);
    const weightKg = Math.max(1, Math.ceil(totalWeight / 1000));

    return [
      {
        courier_name: 'JNE',
        courier_code: 'jne',
        courier_service_name: 'REG',
        courier_service_code: 'reg',
        description: 'Layanan Reguler JNE',
        duration: '2 - 3 Hari',
        price: 18000 * weightKg,
        type: 'standard',
      },
      {
        courier_name: 'JNE',
        courier_code: 'jne',
        courier_service_name: 'YES',
        courier_service_code: 'yes',
        description: 'Yakin Esok Sampai',
        duration: '1 Hari',
        price: 32000 * weightKg,
        type: 'express',
      },
      {
        courier_name: 'SiCepat',
        courier_code: 'sicepat',
        courier_service_name: 'SIUNTUNG',
        courier_service_code: 'siuntung',
        description: 'SiCepat Standar SiUntung',
        duration: '2 - 3 Hari',
        price: 17000 * weightKg,
        type: 'standard',
      },
      {
        courier_name: 'SiCepat',
        courier_code: 'sicepat',
        courier_service_name: 'BEST',
        courier_service_code: 'best',
        description: 'Besok Sampai Tujuan',
        duration: '1 Hari',
        price: 30000 * weightKg,
        type: 'express',
      },
      {
        courier_name: 'J&T',
        courier_code: 'jnt',
        courier_service_name: 'EZ',
        courier_service_code: 'ez',
        description: 'J&T Standard Express',
        duration: '2 - 3 Hari',
        price: 18000 * weightKg,
        type: 'standard',
      },
    ];
  } catch (err: any) {
    console.error('Biteship getBiteshipRates error:', err.message);
    return [];
  }
}
