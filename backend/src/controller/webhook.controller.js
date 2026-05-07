const { Cashfree } = require('cashfree-pg');
const transactionService = require('../services/transaction.service');
const walletService = require('../services/wallet.service');
const Driver = require('../models/driver.model');
const httpStatusCode = require('../constants/httpStatusCode');
const logger = require('../utils/logger'); 

const handleCashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody;

    if (!signature || !timestamp || !rawBody) {
      logger.error('Missing required webhook headers or body');
      return res.status(httpStatusCode.BAD_REQUEST).json({ success: false, message: 'Invalid webhook request' });
    }

    // Verify Signature using official Cashfree SDK
    try {
      Cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return res.status(httpStatusCode.UNAUTHORIZED).json({ success: false, message: 'Invalid signature' });
    }

    const payload = req.body;
    logger.info('Cashfree Webhook received and verified:', payload.type);

    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK' || payload.type === 'PAYMENT_FAILED_WEBHOOK') {
      const orderId = payload.data?.order?.order_id;

      if (!orderId) {
        return res.status(httpStatusCode.BAD_REQUEST).json({ success: false, message: 'Missing order_id' });
      }

      // Route 1: Wallet Recharge (RCG_ prefix is set in wallet.service.js)
      if (orderId.startsWith('RCG_')) {
        const customerId = payload.data?.customer_details?.customer_id; 

        if (!customerId) {
           logger.error(`Recharge webhook missing customer_id for order: ${orderId}`);
           return res.status(httpStatusCode.BAD_REQUEST).send('Missing customer ID');
        }

        const driver = await Driver.findOne({ userId: customerId });
        if (!driver) {
           logger.error(`Driver not found for recharge webhook. customerId: ${customerId}`);
           return res.status(httpStatusCode.NOT_FOUND).send('Driver not found');
        }

        logger.info(`Triggering wallet recharge verification via Webhook for driver: ${driver._id}, order: ${orderId}`);
        // This method securely polls cashfree and handles atomic updates
        await walletService.verifyRecharge(driver._id, orderId);

      } else {
        // Route 2: Normal Package Delivery Transaction
        logger.info(`Triggering transaction verification via Webhook for cashfree order: ${orderId}`);
        // This method securely polls cashfree and updates Order & Transaction statuses
        await transactionService.VerifyTransaction({ cashfreeOrderId: orderId });
      }
    }

    // Always return 200 OK so Cashfree knows it was received and stops retrying
    return res.status(httpStatusCode.OK).send('Webhook processed successfully');

  } catch (error) {
    logger.error('Error handling Cashfree webhook:', error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send('Internal server error');
  }
};

module.exports = {
  handleCashfreeWebhook
};
