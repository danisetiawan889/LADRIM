import { Request, Response } from 'express';
import { verifyCart, setAddress } from '../services/checkout.service';
import { createPayment, handleMidtransWebhook } from '../services/payment.service';

export const start = async (req: Request, res: Response) => {
  const who = req.principal?.kind === 'user' ? { userId: req.principal.sub } : { guestEmail: req.body.email };
  if (!who.userId && !who.guestEmail) return res.status(400).json({ error: 'Email required for guest checkout' });
  res.status(201).json(await verifyCart(req.body.items, who));
};
export const address = async (req: Request, res: Response) => {
  // TODO: call the courier API (RajaOngkir / Biteship) to validate the address and fetch the tariff.
  const cost = 0;
  await setAddress(req.params.id, req.body.address, req.body.courier, cost);
  res.json({ ok: true });
};
export const pay = async (req: Request, res: Response) => res.json(await createPayment(req.params.id));
export const webhook = async (req: Request, res: Response) => {
  await handleMidtransWebhook(req.body);
  res.sendStatus(200);
};
