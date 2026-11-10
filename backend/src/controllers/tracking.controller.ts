import { Request, Response } from 'express';
import {
  getOrderTracking,
  updateOrderTracking,
  mapRawStatusToState,
  getTrackingUiDetails,
  buildTimelineSteps,
} from '../services/tracking.service';

/**
 * Endpoint for Frontend: GET /api/orders/track/:id
 * Returns clean, high-level simplified tracking object matching Gymshark specification.
 */
export async function trackOrder(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const email = (req.query.email || req.body?.email) as string | undefined;

    if (!id) {
      return res.status(400).json({ error: 'Order ID or tracking number required' });
    }

    const tracking = await getOrderTracking(id, email);
    return res.json(tracking);
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Failed to retrieve order tracking' });
  }
}

/**
 * Webhook Ingestion: POST /api/webhook/tracking
 * Adaptable for AfterShip, Biteship, 17TRACK, or Direct Logistics Provider payloads.
 */
export async function handleCarrierWebhook(req: Request, res: Response) {
  try {
    const body = req.body || {};

    let orderId: string | undefined;
    let trackingNumber: string | undefined;
    let rawStatus: string | undefined;
    let courier: string | undefined;
    let location: string | undefined;
    let eventTime: string | undefined;

    // 1. AfterShip Format detection
    if (body.msg && (body.msg.tag || body.msg.subtag_message || body.msg.checkpoints)) {
      trackingNumber = body.msg.tracking_number;
      courier = body.msg.slug;
      orderId = body.msg.order_id || body.msg.custom_fields?.order_id;

      const latestCheckpoint = body.msg.checkpoints?.[body.msg.checkpoints.length - 1];
      rawStatus = latestCheckpoint?.message || body.msg.subtag_message || body.msg.tag;
      location = latestCheckpoint?.location || latestCheckpoint?.city;
      eventTime = latestCheckpoint?.checkpoint_time;
    }
    // 2. 17TRACK Format detection
    else if (body.event === 'TRACKING_UPDATED' && body.data?.track_info) {
      const trackInfo = body.data.track_info;
      trackingNumber = trackInfo.tracking_number;
      courier = trackInfo.carrier_code;
      orderId = trackInfo.custom_fields?.order_id;
      rawStatus = trackInfo.latest_status?.sub_status || trackInfo.latest_event?.description;
      location = trackInfo.latest_event?.location;
      eventTime = trackInfo.latest_event?.time_iso;
    }
    // 3. Biteship Format detection
    else if (body.event && (body.courier_tracking_id || body.courier_waybill_id || body.tracking_id || body.status)) {
      trackingNumber = body.courier_tracking_id || body.courier_waybill_id || body.tracking_id || body.waybill_id;
      orderId = body.order_id || body.orderId || body.reference_id;
      courier = body.courier_company || body.courier || body.courier_code;
      rawStatus = body.status || body.note;
      location = body.location || body.note;
      eventTime = body.timestamp || body.updated_at;
    }
    // 4. Standard / Generic Carrier Webhook Format
    else {
      orderId = body.order_id || body.orderId;
      trackingNumber = body.tracking_number || body.trackingNumber;
      rawStatus = body.raw_status || body.rawStatus || body.status || body.message;
      courier = body.courier || body.carrier;
      location = body.location;
      eventTime = body.timestamp || body.event_time;
    }

    if (!rawStatus) {
      return res.status(400).json({ error: 'Missing raw status property in webhook payload' });
    }

    if (!orderId && !trackingNumber) {
      return res.status(400).json({ error: 'Missing order_id or tracking_number identifier' });
    }

    const result = await updateOrderTracking(
      { orderId, trackingNumber },
      rawStatus,
      {
        courier,
        location,
        eventTime,
        rawPayload: body,
      }
    );

    const uiDetails = getTrackingUiDetails(result.current_state);

    return res.status(200).json({
      success: true,
      order_id: result.order_id,
      current_state: result.current_state,
      ui_title: uiDetails.ui_title,
      ui_description: uiDetails.ui_description,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Webhook processing failed' });
  }
}

/**
 * Developer Testing & Demo Simulator: POST /api/orders/track/:id/simulate
 * Allows manually sending raw status string to test state mapping & UI response.
 */
export async function simulateStatusUpdate(req: Request, res: Response) {
  try {
    // 🔒 Security check: Simulator is strictly restricted to Admins or Non-Production environments
    if (process.env.NODE_ENV === 'production' && req.principal?.kind !== 'admin') {
      return res.status(403).json({
        error: 'Tracking simulator is disabled in production for non-administrators',
      });
    }

    const id = req.params.id;
    const { raw_status, courier, location, tracking_number } = req.body;

    if (!raw_status) {
      return res.status(400).json({ error: 'raw_status string is required' });
    }

    const result = await updateOrderTracking(
      { orderId: id },
      raw_status,
      {
        courier,
        location,
        trackingNumber: tracking_number,
        rawPayload: { simulated: true, timestamp: new Date() },
      }
    );

    const uiDetails = getTrackingUiDetails(result.current_state);
    const steps = buildTimelineSteps(result.current_state);

    return res.json({
      success: true,
      order_id: result.order_id,
      current_state: result.current_state,
      ui_title: uiDetails.ui_title,
      ui_description: uiDetails.ui_description,
      raw_status: result.raw_status,
      steps,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Simulation failed' });
  }
}
