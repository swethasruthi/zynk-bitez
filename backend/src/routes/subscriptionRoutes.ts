import express from 'express';
import {
  createNewSubscription,
  getSubscriptions,
  getSubscription,
  updateAddress,
  skipMeal,
  swapMeal,
  pauseSub,
  resumeSub,
  cancelSub,
  checkLockStatus,
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middlewares/auth.js';
import { isCustomer } from '../middlewares/authorize.js';
import {
  validateRequest,
  createSubscriptionSchema,
  updateAddressSchema,
  swapMealSchema,
} from '../middlewares/validation.js';

const router = express.Router();

// All subscription routes require authentication and customer role
router.use(authenticate);
router.use(isCustomer);

// Create a new subscription with validation
router.post('/', validateRequest(createSubscriptionSchema), createNewSubscription);

// Get all user subscriptions
router.get('/', getSubscriptions);

// Get a specific subscription
router.get('/:id', getSubscription);

// Update subscription address (locked after 8 PM Friday) with validation
router.put('/:id/address', validateRequest(updateAddressSchema), updateAddress);

// Skip next week's meal (locked after 8 PM Friday)
router.post('/:id/skip', skipMeal);

// Swap meal for next week (locked after 8 PM Friday) with validation
router.post('/:id/swap', validateRequest(swapMealSchema), swapMeal);

// Pause subscription (no time restriction)
router.post('/:id/pause', pauseSub);

// Resume paused subscription (no time restriction)
router.post('/:id/resume', resumeSub);

// Cancel subscription (no time restriction)
router.delete('/:id/cancel', cancelSub);

// Public endpoint: Check current lock status
router.get('/status/lock', (req, res) => {
  // Remove auth check for this utility endpoint
  res.locals.skipAuth = true;
  checkLockStatus(req, res);
});

export default router;
