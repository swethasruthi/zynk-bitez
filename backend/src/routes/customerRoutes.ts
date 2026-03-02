import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { isCustomer } from '../middlewares/authorize.js';
import {
  changeDeliveryAddress,
  createOrder,
  createSubscriptionPending,
  listChefPlans,
  listChefs,
  paymentWebhook,
  skipDelivery,
} from '../controllers/customerFlowController.js';
import {
  chefsWithPreview,
  chefFullDetails,
  listSubscriptions,
  subscriptionDetail,
  subscriptionDeliveries,
  pauseSubscriptionHandler,
  resumeSubscriptionHandler,
} from '../controllers/customerBrowseController.js';

const router = express.Router();

// ── Existing endpoints (preserved) ────────────────────────────────────────────
router.get('/customer/chefs', authenticate, isCustomer, listChefs);
router.get('/customer/chefs/:id/plans', authenticate, isCustomer, listChefPlans);
router.post('/subscriptions', authenticate, isCustomer, createSubscriptionPending);
router.post('/payments/create-order', authenticate, isCustomer, createOrder);
router.post('/payments/webhook', paymentWebhook);
router.patch('/delivery/:id/skip', authenticate, isCustomer, skipDelivery);
router.patch('/delivery/:id/change-address', authenticate, isCustomer, changeDeliveryAddress);

// ── Browse & tracking endpoints ───────────────────────────────────────────────
router.get('/customer/chefs-with-preview', authenticate, isCustomer, chefsWithPreview);
router.get('/customer/chefs/:id/full', authenticate, isCustomer, chefFullDetails);
router.get('/customer/subscriptions', authenticate, isCustomer, listSubscriptions);
router.get('/customer/subscription/:id', authenticate, isCustomer, subscriptionDetail);
router.get('/customer/subscription/:id/deliveries', authenticate, isCustomer, subscriptionDeliveries);
router.patch('/customer/subscription/:id/pause', authenticate, isCustomer, pauseSubscriptionHandler);
router.patch('/customer/subscription/:id/resume', authenticate, isCustomer, resumeSubscriptionHandler);

export default router;
