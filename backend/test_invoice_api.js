require('dotenv').config();
const { generateAndUploadInvoice } = require('./src/utils/pdfGenerator');

const runTest = async () => {
    try {
        const dummyOrder = {
            orderId: "TEST_ORDER_123",
            createdAt: new Date(),
            senderDetails: { name: "Sender", mobile: "999", location: { address: "Add1" } },
            receiverDetails: { name: "Receiver", mobile: "888", location: { address: "Add2" } },
            packageDetails: { weight: "5" },
            payment: { method: "CASH", status: "COMPLETED" },
            pricing: { totalAmount: 100 }
        };

        console.log('Testing generateAndUploadInvoice with dummy order...');
        const url = await generateAndUploadInvoice(dummyOrder);
        console.log('SUCCESS API Response:', url);
    } catch (error) {
        console.error('Fatal Test Error:', error);
    } finally {
        process.exit(0);
    }
};

runTest();
