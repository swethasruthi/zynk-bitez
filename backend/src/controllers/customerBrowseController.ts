import express from 'express';
import {
  getChefsWithPreview,
  getChefFullDetails,
  getSubscriptionDetails,
  getDeliveriesForSubscription,
  getCustomerProfileByUserId,
} from '../models/marketplaceQueries.js';

/**
 * GET /api/customer/chefs-with-preview
 * Returns approved chefs matching customer pincode, with plan previews + starting price.
 */
export const chefsWithPreview = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const profile = await getCustomerProfileByUserId(req.user.userId);
  if (!profile) {
    res.status(400).json({ success: false, message: 'Complete customer profile first' });
    return;
  }

  const chefs = await getChefsWithPreview(profile.pincode);
  res.status(200).json({ success: true, chefs });
};

/**
 * GET /api/customer/chefs/:id/full
 * Returns full chef details + all available plans.
 */
export const chefFullDetails = async (req: express.Request, res: express.Response): Promise<void> => {
  const chefId = Number(req.params.id);
  if (Number.isNaN(chefId)) {
    res.status(400).json({ success: false, message: 'Invalid chef id' });
    return;
  }

  const result = await getChefFullDetails(chefId);
  if (!result) {
    res.status(404).json({ success: false, message: 'Chef not found' });
    return;
  }

  res.status(200).json({ success: true, ...result });
};

/**
 * GET /api/customer/subscription/:id
 * Returns subscription details with chef name.
 */
export const subscriptionDetail = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const subscriptionId = Number(req.params.id);
  if (Number.isNaN(subscriptionId)) {
    res.status(400).json({ success: false, message: 'Invalid subscription id' });
    return;
  }

  const subscription = await getSubscriptionDetails(subscriptionId, req.user.userId);
  if (!subscription) {
    res.status(404).json({ success: false, message: 'Subscription not found' });
    return;
  }

  res.status(200).json({ success: true, subscription });
};

/**
 * GET /api/customer/subscription/:id/deliveries
 * Returns all deliveries for a subscription.
 */
export const subscriptionDeliveries = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const subscriptionId = Number(req.params.id);
  if (Number.isNaN(subscriptionId)) {
    res.status(400).json({ success: false, message: 'Invalid subscription id' });
    return;
  }

  const deliveryList = await getDeliveriesForSubscription(subscriptionId, req.user.userId);
  res.status(200).json({ success: true, deliveries: deliveryList });
};
