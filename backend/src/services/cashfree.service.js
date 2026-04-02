const { cashfree } = require('../config/cashfreeConfig');

/**
 * Create a Cashfree order
 * @param {Object} orderData - Order details
 * @returns {Object} Cashfree order response
 */
const createOrder = async (orderData) => {
  try {
    const {
      orderId,
      amount,
      currency = 'INR',
      customerDetails,
      orderMeta = {},
      returnUrl,
      notifyUrl
    } = orderData;

    // Clean and validate customer ID - remove any extra quotes and ensure alphanumeric format
    let cleanCustomerId = customerDetails.customerId;
    if (typeof cleanCustomerId === 'string') {
      cleanCustomerId = cleanCustomerId.replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
      cleanCustomerId = cleanCustomerId.replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace invalid chars with underscore
    }

    // Validate required fields
    if (!cleanCustomerId || !customerDetails.customerName || !customerDetails.customerEmail || !customerDetails.customerPhone) {
      throw new Error('Missing required customer details');
    }

    const orderRequest = {
      order_id: orderId,
      order_amount: amount.toString(),
      order_currency: currency,
      customer_details: {
        customer_id: cleanCustomerId,
        customer_name: customerDetails.customerName || 'Customer',
        customer_email: customerDetails.customerEmail,
        customer_phone: customerDetails.customerPhone,
      },
      order_meta: {
        ...orderMeta
      },
      order_note: `Payment for order ${orderId}`,
    };

    console.log('Creating Cashfree order with data:', orderRequest);

    const response = await cashfree.PGCreateOrder(orderRequest);

    console.log('Cashfree order created successfully:', response.data);

    // SDK v5 returns data directly in response.data or similar
    const result = response.data;

    return {
      success: true,
      data: {
        orderId: result.order_id,
        sessionId: result.payment_session_id,
        orderStatus: result.order_status,
      },
    };
  } catch (error) {
    console.error('Error creating Cashfree order:', error.response?.data || error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

/**
 * Get order details from Cashfree
 * @param {string} orderId - Cashfree order ID
 * @returns {Object} Order details
 */
const getOrderDetails = async (orderId) => {
  try {
    const response = await cashfree.PGFetchOrder(orderId);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error fetching Cashfree order:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

/**
 * Create payment session for mobile apps
 * @param {string} orderId - Cashfree order ID
 * @returns {Object} Payment session details
 */
const createPaymentSession = async (orderId) => {
  try {
    const response = await cashfree.PGOrderFetchPayments(orderId);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error creating payment session:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

/**
 * Verify payment status
 * @param {string} orderId - Cashfree order ID
 * @returns {Object} Payment verification result
 */
const verifyPayment = async (orderId) => {
  try {
    const orderResponse = await getOrderDetails(orderId);

    if (!orderResponse.success) {
      return orderResponse;
    }

    const order = orderResponse.data;
    if (!order) return { success: false, error: "Order not found in Cashfree" };

    return {
      success: true,
      data: {
        orderId: order.order_id,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
        orderAmount: order.order_amount,
        paidAmount: order.paid_amount || 0,
        orderNote: order.order_note,
      },
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

/**
 * Get order expiry time (30 minutes from now)
 * @returns {string} ISO timestamp
 */
const getOrderExpiryTime = () => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 30);
  return expiryTime.toISOString();
};

/**
 * Handle webhook verification
 * @param {Object} webhookBody - Webhook payload
 * @param {string} signature - Webhook signature
 * @returns {boolean} Verification result
 */
const verifyWebhookSignature = (webhookBody, signature) => {
  try {
    // Implement webhook signature verification
    // This is a basic implementation - you should use proper cryptographic verification
    const crypto = require('crypto');
    const { cashfreeConfig } = require('../config/cashfreeConfig');
    const clientSecret = cashfreeConfig.clientSecret;

    const expectedSignature = crypto
      .createHmac('sha256', clientSecret)
      .update(JSON.stringify(webhookBody))
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Create a refund for a Cashfree order
 * @param {string} orderId - Cashfree order ID
 * @param {number} refundAmount - Amount to refund
 * @param {string} refundId - Unique refund ID string
 * @returns {Object} Refund response
 */
const createRefund = async (orderId, refundAmount, refundId) => {
  try {
    const refundRequest = {
      refund_amount: refundAmount,
      refund_id: refundId,
      refund_note: "User requested cancellation"
    };

    const { cashfreeConfig } = require('../config/cashfreeConfig');
    const baseURL = cashfreeConfig.environment === 'SANDBOX' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';

    console.log(`Initiating Cashfree refund for order ${orderId}, amount: ${refundAmount} via ${baseURL}`);

    const response = await axios.post(`${baseURL}/orders/${orderId}/refunds`, refundRequest, {
      headers: {
        'x-client-id': cashfreeConfig.clientId,
        'x-client-secret': cashfreeConfig.clientSecret,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    console.log('Cashfree refund initiated successfully:', response.data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error initiating Cashfree refund:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

module.exports = {
  createOrder,
  getOrderDetails,
  createPaymentSession,
  verifyPayment,
  getOrderExpiryTime,
  verifyWebhookSignature,
  createRefund
};

/**
 * Cashfree Payout V2 API
 * Docs: https://docs.cashfree.com/reference/payouts-v2
 * V1 is fully deprecated. V2 uses direct header auth (x-client-id / x-client-secret).
 */
const axios = require('axios');

/**
 * Get the Payout V2 base URL and common headers.
 */
const getPayoutConfig = () => {
  const { cashfreeConfig } = require('../config/cashfreeConfig');
  const baseURL = cashfreeConfig.environment === 'SANDBOX'
    ? 'https://sandbox.cashfree.com/payout'
    : 'https://api.cashfree.com/payout';

  const headers = {
    'x-client-id': process.env.CASHFREE_PAYOUT_CLIENT_ID || cashfreeConfig.clientId,
    'x-client-secret': process.env.CASHFREE_PAYOUT_CLIENT_SECRET || cashfreeConfig.clientSecret,
    'x-api-version': '2024-01-01',
    'Content-Type': 'application/json'
  };

  return { baseURL, headers };
};

const createBeneficiary = async (beneDetails) => {
  try {
    const { cashfreeConfig } = require('../config/cashfreeConfig');
    // If no payout keys provided, simulate success for development
    if (!process.env.CASHFREE_PAYOUT_CLIENT_ID) {
      console.warn("No CASHFREE_PAYOUT_CLIENT_ID found, simulating Add Beneficiary.");
      return { success: true, message: "Simulated Beneficiary Creation" };
    }

    const { baseURL, headers } = getPayoutConfig();

    // Map v1 field names to v2 field names
    const v2Body = {
      beneficiary_id: beneDetails.beneId,
      beneficiary_name: beneDetails.name,
      beneficiary_email: beneDetails.email,
      beneficiary_phone: beneDetails.phone,
      beneficiary_address: beneDetails.address1 || "India",
    };

    if (beneDetails.bankAccount) {
      v2Body.beneficiary_instrument_details = {
        bank_account_number: beneDetails.bankAccount,
        bank_ifsc: beneDetails.ifsc
      };
    } else if (beneDetails.vpa) {
      v2Body.beneficiary_instrument_details = {
        vpa: beneDetails.vpa
      };
    }

    const response = await axios.post(`${baseURL}/beneficiary`, v2Body, { headers });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error creating Beneficiary:', error.response?.data || error.message);
    // If beneficiary already exists (409 Conflict), treat as success
    if (error.response?.status === 409) {
      return { success: true, message: "Beneficiary already exists" };
    }
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

const requestTransfer = async (transferDetails) => {
  try {
    const { cashfreeConfig } = require('../config/cashfreeConfig');

    // Simulate real money transfer if no exact payout keys provided
    if (!process.env.CASHFREE_PAYOUT_CLIENT_ID) {
      console.warn("No CASHFREE_PAYOUT_CLIENT_ID found, simulating Payout Transfer.");
      return { success: true, data: { referenceId: "SIM_" + Date.now(), status: "SUCCESS" } };
    }

    const { baseURL, headers } = getPayoutConfig();

    // Map v1 field names to v2 field names
    const v2Body = {
      transfer_id: transferDetails.transferId,
      transfer_amount: parseFloat(transferDetails.amount),
      transfer_mode: transferDetails.transferMode.toLowerCase(),
      beneficiary_details: {
        beneficiary_name: transferDetails.beneName || "Driver",
        beneficiary_instrument_details: transferDetails.beneInstrument || {},
      },
    };

    const response = await axios.post(`${baseURL}/transfers`, v2Body, { headers });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error requesting Transfer:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

module.exports.createBeneficiary = createBeneficiary;
module.exports.requestTransfer = requestTransfer;