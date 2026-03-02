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

const router = express.Router();

router.get('/customer/chefs', authenticate, isCustomer, listChefs);
router.get('/customer/chefs/:id/plans', authenticate, isCustomer, listChefPlans);
router.post('/subscriptions', authenticate, isCustomer, createSubscriptionPending);
router.post('/payments/create-order', authenticate, isCustomer, createOrder);
router.post('/payments/webhook', paymentWebhook);
router.patch('/delivery/:id/skip', authenticate, isCustomer, skipDelivery);
router.patch('/delivery/:id/change-address', authenticate, isCustomer, changeDeliveryAddress);

export default router;
