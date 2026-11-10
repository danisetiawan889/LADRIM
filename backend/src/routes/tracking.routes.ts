import { Router } from 'express';
import {
  trackOrder,
  handleCarrierWebhook,
  simulateStatusUpdate,
} from '../controllers/tracking.controller';
import { validate, trackingSimulatorSchema } from '../middlewares/validate';

const router = Router();

// Webhook ingestion from couriers (AfterShip, Biteship, 17TRACK, etc.)
router.post('/webhook', handleCarrierWebhook);

// Customer tracking query
router.get('/:id', trackOrder);

// Dev / Testing simulator (locked down with schema validation & environment check)
router.post('/:id/simulate', validate(trackingSimulatorSchema), simulateStatusUpdate);

export default router;
