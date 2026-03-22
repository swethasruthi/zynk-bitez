import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getActiveSubscription, createSubscription } from '../models/subscriptionQueries.js';
import { getNextBillingDate, isSkipSwapLockedByTime } from '../utils/subscriptionUtils.js';
import { ensureUpcomingMealsForCustomer } from '../services/mealPlannerService.js';

const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
};

const planConfig: Record<string, { mealsPerWeek: number; priceInCents: number }> = {
  basic: { mealsPerWeek: 5, priceInCents: 299900 },
  standard: { mealsPerWeek: 7, priceInCents: 449900 },
  premium: { mealsPerWeek: 15, priceInCents: 599900 },
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', plan } = req.body;

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) < 1) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const amountInPaise = Math.round(Number(amount));
    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: { plan: plan || '' },
    });

    res.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      chefId,
      homeAddress,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification data missing' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const userId = req.user?.userId;
    if (!userId || typeof userId !== 'number') {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const existing = await getActiveSubscription(userId);
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already has an active subscription' });
    }

    const planKey = (plan || 'standard').toLowerCase();
    const config = planConfig[planKey] || planConfig.standard;

    if (!homeAddress?.street || !homeAddress?.city || !homeAddress?.zipCode) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    const deliveryAddress = `${homeAddress.street}, ${homeAddress.city}, ${homeAddress.state || ''} - ${homeAddress.zipCode}`.trim();
    const parsedChefId = chefId != null ? parseInt(String(chefId), 10) : null;
    const chefIdValue = !Number.isNaN(parsedChefId) && parsedChefId > 0 ? parsedChefId : null;
    const isLocked = isSkipSwapLockedByTime();

    const subscription = await createSubscription({
      userId,
      planName: planKey.charAt(0).toUpperCase() + planKey.slice(1),
      chefId: chefIdValue,
      mealsPerWeek: config.mealsPerWeek,
      priceInCents: config.priceInCents,
      deliveryAddress,
      postalCode: String(homeAddress.zipCode),
      city: homeAddress.city,
      status: 'active',
      nextBillingDate: getNextBillingDate(),
      isSkipSwapLocked: isLocked,
      lockAppliedAt: isLocked ? new Date() : null,
    });

    try {
      await ensureUpcomingMealsForCustomer(userId);
    } catch (seedError) {
      console.error('Failed to seed meals after payment:', seedError);
    }

    res.json({
      success: true,
      message: 'Payment verified',
      paymentId: razorpay_payment_id,
      plan: planKey,
      subscription: {
        id: subscription.id,
        planName: subscription.planName,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};
