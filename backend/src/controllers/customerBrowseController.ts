import express from 'express';
import {
  getChefsWithPreview,
  getChefFullDetails,
  getSubscriptionDetails,
  getDeliveriesForSubscription,
  getCustomerProfileByUserId,
  getAllSubscriptionsForUser,
  pauseSubscriptionById,
  resumeSubscriptionById,
} from '../models/marketplaceQueries.js';

/**
 * GET /api/customer/chefs-with-preview
 */
export const chefsWithPreview = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

  const profile = await getCustomerProfileByUserId(req.user.userId);
  if (!profile) { res.status(400).json({ success: false, message: 'Complete customer profile first' }); return; }

  const chefs = await getChefsWithPreview(profile.pincode);
  res.status(200).json({ success: true, chefs });
};

/**
 * GET /api/customer/chefs/:id/full
 */
export const chefFullDetails = async (req: express.Request, res: express.Response): Promise<void> => {
  const chefId = Number(req.params.id);
  if (Number.isNaN(chefId)) { res.status(400).json({ success: false, message: 'Invalid chef id' }); return; }

  const result = await getChefFullDetails(chefId);
  if (!result) { res.status(404).json({ success: false, message: 'Chef not found' }); return; }

  res.status(200).json({ success: true, ...result });
};

/**
 * GET /api/customer/subscriptions
 */
export const listSubscriptions = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

  const subscriptions = await getAllSubscriptionsForUser(req.user.userId);
  res.status(200).json({ success: true, subscriptions });
};

/**
 * GET /api/customer/subscription/:id
 */
export const subscriptionDetail = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

  const subscriptionId = Number(req.params.id);
  if (Number.isNaN(subscriptionId)) { res.status(400).json({ success: false, message: 'Invalid subscription id' }); return; }

  const subscription = await getSubscriptionDetails(subscriptionId, req.user.userId);
  if (!subscription) { res.status(404).json({ success: false, message: 'Subscription not found' }); return; }

  res.status(200).json({ success: true, subscription });
};

/**
 * GET /api/customer/subscription/:id/deliveries
 */
export const subscriptionDeliveries = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

  const subscriptionId = Number(req.params.id);
  if (Number.isNaN(subscriptionId)) { res.status(400).json({ success: false, message: 'Invalid subscription id' }); return; }

  const deliveryList = await getDeliveriesForSubscription(subscriptionId, req.user.userId);
  res.status(200).json({ success: true, deliveries: deliveryList });
};

/**
 * PATCH /api/customer/subscription/:id/pause
 */
export const pauseSubscriptionHandler = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

  const subscriptionId = Number(req.params.id);
  if (Number.isNaN(subscriptionId)) { res.status(400).json({ success: false, message: 'Invalid subscription id' }); return; }

  const updated = await pauseSubscriptionById(subscriptionId, req.user.userId);
  if (!updated) { res.status(400).json({ success: false, message: 'Cannot pause. Subscription may not be active or not owned by you.' }); return; }

  res.status(200).json({ success: true, subscription: updated });
};

/**
 * PATCH /api/customer/subscription/:id/resume
 */
export const resumeSubscriptionHandler = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

  const subscriptionId = Number(req.params.id);
  if (Number.isNaN(subscriptionId)) { res.status(400).json({ success: false, message: 'Invalid subscription id' }); return; }

  const updated = await resumeSubscriptionById(subscriptionId, req.user.userId);
  if (!updated) { res.status(400).json({ success: false, message: 'Cannot resume. Subscription may not be paused or not owned by you.' }); return; }

  res.status(200).json({ success: true, subscription: updated });
};
