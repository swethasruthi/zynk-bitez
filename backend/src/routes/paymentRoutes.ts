import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create-order', authenticateToken, createOrder);
router.post('/verify', authenticateToken, verifyPayment);

export default router;
