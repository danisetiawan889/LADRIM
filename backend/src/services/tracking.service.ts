import { query, tx } from '../config/db';

export type TrackingState = 'ORDERED' | 'SHIPPED' | 'IN_CUSTOMS' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface TrackingUiDetails {
  state: TrackingState;
  state_index: number; // 1 to 5
  ui_title: string;
  ui_description: string;
}

export interface TrackingStep {
  state: TrackingState;
  label: string;
  step_number: number;
  is_completed: boolean;
  is_current: boolean;
}

export interface TrackingResponse {
  order_id: string;
  tracking_number: string | null;
  courier: string | null;
  destination_country?: string;
  is_international?: boolean;
  current_state: TrackingState;
  state_index: number;
  ui_title: string;
  ui_description: string;
  updated_at: string;
  steps: TrackingStep[];
  history?: Array<{
    raw_status: string;
    mapped_state: TrackingState;
    location: string | null;
    event_time: string;
  }>;
}

// 1. Strict List of Raw Statuses mapped to 5 States
const RAW_STATUS_MAPPING: Record<string, TrackingState> = {
  // STATE 1: 'ORDERED'
  'shipment information received': 'ORDERED',
  'manifest pickup': 'ORDERED',
  'order processed': 'ORDERED',
  'preparing': 'ORDERED',
  'allocated': 'ORDERED',
  'picking_up': 'ORDERED',
  'courier_assigned': 'ORDERED',

  // STATE 2: 'SHIPPED'
  'scanned at origin facility': 'SHIPPED',
  'picked up': 'SHIPPED',
  'picked': 'SHIPPED',
  'collected': 'SHIPPED',
  'processed at hub': 'SHIPPED',
  'departed facility': 'SHIPPED',
  'handover to airline': 'SHIPPED',
  'in flight': 'SHIPPED',
  'arrived at destination airport': 'SHIPPED',

  // STATE 3: 'IN_CUSTOMS'
  'clearance event': 'IN_CUSTOMS',
  'handover to customs': 'IN_CUSTOMS',
  'held by customs': 'IN_CUSTOMS',
  'awaiting payment/tax': 'IN_CUSTOMS',
  'customs inspection': 'IN_CUSTOMS',
  'on_hold': 'IN_CUSTOMS',

  // STATE 4: 'OUT_FOR_DELIVERY'
  'customs clearance complete': 'OUT_FOR_DELIVERY',
  'released': 'OUT_FOR_DELIVERY',
  'arrived at delivery facility': 'OUT_FOR_DELIVERY',
  'with delivery courier': 'OUT_FOR_DELIVERY',
  'out for delivery': 'OUT_FOR_DELIVERY',
  'dropping_off': 'OUT_FOR_DELIVERY',
  'delivering': 'OUT_FOR_DELIVERY',

  // STATE 5: 'DELIVERED'
  'delivered': 'DELIVERED',
  'signed': 'DELIVERED',
  'package received': 'DELIVERED',
};

// State Hierarchy Index (Order cannot silently downgrade unless forced)
export const STATE_ORDER: Record<TrackingState, number> = {
  ORDERED: 1,
  SHIPPED: 2,
  IN_CUSTOMS: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
};

// UI Presentation Metadata per State for Domestic (Indonesia) shipments
export const DOMESTIC_STATE_UI_CONFIG: Record<TrackingState, { title: string; description: string; label: string }> = {
  ORDERED: {
    label: 'Order Placed',
    title: 'Pesanan Dikonfirmasi & Disiapkan',
    description: 'Pesanan Anda telah diterima dan sedang dipersiapkan di fasilitas warehouse LADRIM.',
  },
  SHIPPED: {
    label: 'Dispatched',
    title: 'Diserahkan ke Kurir Ekspedisi',
    description: 'Paket telah diserahkan ke pihak ekspedisi logistik dan sedang dalam perjalanan pengiriman antar-kota.',
  },
  IN_CUSTOMS: {
    label: 'Hub Transit',
    title: 'Pusat Sortir Gateway / Hub Transit',
    description: 'Paket telah tiba di pusat sortir gateway transit logistik untuk diteruskan ke hub kota tujuan Anda.',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    title: 'Kurir Menuju Alamat Anda',
    description: 'Paket telah tiba di fasilitas logistik terdekat dan sedang dibawa kurir menuju pintu rumah Anda.',
  },
  DELIVERED: {
    label: 'Delivered',
    title: 'Paket Berhasil Diterima',
    description: 'Paket telah tiba dan diterima dengan aman di alamat tujuan. Terima kasih telah berbelanja di LADRIM.',
  },
};

// UI Presentation Metadata per State for International (Overseas) shipments
export function getInternationalStateUiConfig(destinationCountry: string = 'International'): Record<TrackingState, { title: string; description: string; label: string }> {
  const country = destinationCountry.trim() || 'Luar Negeri';
  return {
    ORDERED: {
      label: 'Order Placed',
      title: 'Pesanan Dikonfirmasi & Siap Ekspor',
      description: `Pesanan internasional Anda telah dikonfirmasi dan disiapkan bersama dokumen ekspor di warehouse LADRIM.`,
    },
    SHIPPED: {
      label: 'Intl Flight',
      title: 'Penerbangan Kargo Internasional',
      description: `Paket telah diberangkatkan melalui penerbangan kargo udara internasional menuju ${country}.`,
    },
    IN_CUSTOMS: {
      label: 'Customs',
      title: `Pemeriksaan Bea Cukai (${country})`,
      description: `Paket telah tiba di bandara internasional ${country} dan sedang melalui inspeksi kepabeanan (Customs Clearance) resmi.`,
    },
    OUT_FOR_DELIVERY: {
      label: 'Out for Delivery',
      title: `Kurir Lokal ${country} Mengantar`,
      description: `Paket telah lolos bea cukai dan sedang diantar oleh kurir lokal di ${country} menuju alamat penerima.`,
    },
    DELIVERED: {
      label: 'Delivered',
      title: `Paket Berhasil Diterima (${country})`,
      description: `Paket telah sukses sampai dan diterima dengan aman oleh penerima di ${country}. Terima kasih.`,
    },
  };
}

// Backward-compatible export
export const STATE_UI_CONFIG = DOMESTIC_STATE_UI_CONFIG;

/**
 * Normalizes and maps any raw carrier status string into one of the 5 macro states.
 * Uses exact lookup first, followed by robust keyword matching fallback.
 */
export function mapRawStatusToState(rawStatus: string): TrackingState {
  if (!rawStatus) return 'ORDERED';
  const clean = rawStatus.trim().toLowerCase();

  // 1. Direct exact match
  if (RAW_STATUS_MAPPING[clean]) {
    return RAW_STATUS_MAPPING[clean];
  }

  // 2. Keyword-based matching for international logistics resilience (AfterShip/17TRACK/Biteship variations)
  if (clean.includes('delivered') || clean.includes('signed') || clean.includes('received') || clean.includes('selesai')) {
    return 'DELIVERED';
  }

  if (
    clean.includes('out for delivery') ||
    clean.includes('with delivery courier') ||
    clean.includes('with courier') ||
    clean.includes('delivery facility') ||
    clean.includes('customs clearance complete') ||
    clean.includes('released from customs') ||
    clean.includes('sedang diantar')
  ) {
    return 'OUT_FOR_DELIVERY';
  }

  if (
    clean.includes('customs') ||
    clean.includes('clearance') ||
    clean.includes('held') ||
    clean.includes('tax') ||
    clean.includes('inspection') ||
    clean.includes('bea cukai')
  ) {
    return 'IN_CUSTOMS';
  }

  if (
    clean.includes('flight') ||
    clean.includes('airline') ||
    clean.includes('departed') ||
    clean.includes('origin facility') ||
    clean.includes('hub') ||
    clean.includes('transit') ||
    clean.includes('shipped') ||
    clean.includes('airport') ||
    clean.includes('picked up')
  ) {
    return 'SHIPPED';
  }

  // Fallback to initial ordered state
  return 'ORDERED';
}

/**
 * Returns the UI title and description for a given tracking state,
 * adapting contextually for Domestic (Indonesia) vs International shipments.
 */
export function getTrackingUiDetails(state: TrackingState, destinationCountry?: string): TrackingUiDetails {
  const isDomestic = !destinationCountry || destinationCountry.trim().toLowerCase() === 'indonesia';
  const confMap = isDomestic ? DOMESTIC_STATE_UI_CONFIG : getInternationalStateUiConfig(destinationCountry);
  const conf = confMap[state] || confMap.ORDERED;
  return {
    state,
    state_index: STATE_ORDER[state],
    ui_title: conf.title,
    ui_description: conf.description,
  };
}

/**
 * Builds the 5-step progress timeline for the UI component,
 * adapting labels for Domestic (Hub Transit) vs International (Customs) destinations.
 */
export function buildTimelineSteps(currentState: TrackingState, destinationCountry?: string): TrackingStep[] {
  const isDomestic = !destinationCountry || destinationCountry.trim().toLowerCase() === 'indonesia';
  const confMap = isDomestic ? DOMESTIC_STATE_UI_CONFIG : getInternationalStateUiConfig(destinationCountry);
  const currentIndex = STATE_ORDER[currentState];
  const states: TrackingState[] = ['ORDERED', 'SHIPPED', 'IN_CUSTOMS', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  return states.map((s) => {
    const idx = STATE_ORDER[s];
    return {
      state: s,
      label: confMap[s].label,
      step_number: idx,
      is_completed: idx <= currentIndex,
      is_current: idx === currentIndex,
    };
  });
}

/**
 * Processes incoming raw webhook status from carrier, maps to 5 states,
 * updates orders table, and records the event in tracking_events.
 */
export async function updateOrderTracking(
  orderIdentifier: { orderId?: string; trackingNumber?: string },
  rawStatus: string,
  extra: {
    courier?: string;
    trackingNumber?: string;
    location?: string;
    eventTime?: Date | string;
    rawPayload?: unknown;
    force?: boolean;
  } = {}
) {
  const mappedState = mapRawStatusToState(rawStatus);

  return tx(async (q) => {
    // 1. Locate the order
    let orderQuery = `SELECT id, tracking_state, tracking_number, courier FROM orders WHERE `;
    const queryParams: unknown[] = [];

    if (orderIdentifier.orderId) {
      orderQuery += `id = $1`;
      queryParams.push(orderIdentifier.orderId);
    } else if (orderIdentifier.trackingNumber) {
      orderQuery += `tracking_number = $1`;
      queryParams.push(orderIdentifier.trackingNumber);
    } else {
      throw Object.assign(new Error('orderId or trackingNumber required'), { status: 400 });
    }

    const { rows } = await q(orderQuery, queryParams);
    const order = rows[0];

    if (!order) {
      throw Object.assign(new Error(`Order not found for identifier`), { status: 404 });
    }

    const currentOrderState = (order.tracking_state as TrackingState) || 'ORDERED';
    const currentOrderRank = STATE_ORDER[currentOrderState] || 1;
    const newOrderRank = STATE_ORDER[mappedState] || 1;

    // Determine final state: monotonically progress state unless force is requested (e.g. simulation/admin)
    const finalState = (extra.force || newOrderRank >= currentOrderRank) ? mappedState : currentOrderState;

    // 2. Update orders table (update tracking_state and sync lifecycle status)
    const targetOrderStatus =
      finalState === 'DELIVERED'
        ? 'completed'
        : finalState === 'SHIPPED' || finalState === 'OUT_FOR_DELIVERY' || finalState === 'IN_CUSTOMS'
        ? 'shipped'
        : (order.status || 'processing');

    await q(
      `UPDATE orders
          SET tracking_state = $2,
              status = COALESCE($3, status),
              last_raw_status = $4,
              tracking_updated_at = now(),
              courier = COALESCE($5, courier),
              tracking_number = COALESCE($6, tracking_number)
        WHERE id = $1`,
      [
        order.id,
        finalState,
        targetOrderStatus,
        rawStatus,
        extra.courier ?? order.courier,
        extra.trackingNumber ?? order.tracking_number,
      ]
    );

    // 3. Record tracking event history
    await q(
      `INSERT INTO tracking_events (order_id, tracking_number, carrier, raw_status, mapped_state, location, event_time, raw_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        order.id,
        extra.trackingNumber ?? order.tracking_number,
        extra.courier ?? order.courier,
        rawStatus,
        mappedState,
        extra.location ?? null,
        extra.eventTime ? new Date(extra.eventTime) : new Date(),
        extra.rawPayload ? JSON.stringify(extra.rawPayload) : null,
      ]
    );

    return {
      order_id: order.id,
      previous_state: currentOrderState,
      current_state: finalState,
      raw_status: rawStatus,
      mapped_state: mappedState,
    };
  });
}

/**
 * Retrieves simplified tracking payload for frontend consumption.
 * Output strictly matches the user's specification.
 */
export async function getOrderTracking(idOrTrackingNumber: string, email?: string): Promise<TrackingResponse> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrTrackingNumber);

  const { rows } = await query(
    `SELECT o.id, o.tracking_state, o.last_raw_status, o.tracking_updated_at, o.courier, o.tracking_number,
            o.guest_email, u.email as user_email, o.shipping_address
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
      WHERE ${isUuid ? 'o.id = $1' : 'o.tracking_number = $1'}`,
    [idOrTrackingNumber]
  );

  const order = rows[0];
  if (!order) {
    throw Object.assign(new Error('Order not found'), { status: 404 });
  }

  // If email verification was provided, ensure it matches either guest_email or user_email
  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const guestEmail = (order.guest_email || '').trim().toLowerCase();
    const userEmail = (order.user_email || '').trim().toLowerCase();

    if (cleanEmail !== guestEmail && cleanEmail !== userEmail) {
      throw Object.assign(new Error('Email does not match this order. Please verify your email.'), { status: 403 });
    }
  }

  // Extract destination country from shipping_address if present
  let destinationCountry = 'Indonesia';
  if (order.shipping_address) {
    try {
      const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
      if (addr && addr.country && typeof addr.country === 'string' && addr.country.trim()) {
        destinationCountry = addr.country.trim();
      }
    } catch {
      // ignore
    }
  }

  const isInternational = destinationCountry.toLowerCase() !== 'indonesia';
  const currentState: TrackingState = order.tracking_state || 'ORDERED';
  const uiDetails = getTrackingUiDetails(currentState, destinationCountry);
  const steps = buildTimelineSteps(currentState, destinationCountry);

  // Fetch recent granular events
  const { rows: events } = await query(
    `SELECT raw_status, mapped_state, location, event_time
       FROM tracking_events
      WHERE order_id = $1
      ORDER BY event_time DESC, id DESC
      LIMIT 10`,
    [order.id]
  );

  return {
    order_id: String(order.id),
    tracking_number: order.tracking_number ?? null,
    courier: order.courier ?? null,
    destination_country: destinationCountry,
    is_international: isInternational,
    current_state: currentState,
    state_index: uiDetails.state_index,
    ui_title: uiDetails.ui_title,
    ui_description: uiDetails.ui_description,
    updated_at: order.tracking_updated_at ? new Date(order.tracking_updated_at).toISOString() : new Date().toISOString(),
    steps,
    history: events.map((e) => ({
      raw_status: e.raw_status,
      mapped_state: e.mapped_state,
      location: e.location,
      event_time: new Date(e.event_time).toISOString(),
    })),
  };
}
