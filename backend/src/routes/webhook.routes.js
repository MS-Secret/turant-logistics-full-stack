const router = require('express').Router();
const { handleCashfreeWebhook } = require('../controller/webhook.controller');

// Cashfree Webhook endpoint
// We do not use verifyToken middleware here because this endpoint is called directly by Cashfree servers.
router.post('/cashfree', handleCashfreeWebhook);

module.exports = router;
