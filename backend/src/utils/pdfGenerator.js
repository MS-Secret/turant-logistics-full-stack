const PDFDocument = require('pdfkit');
const { cloudinary } = require('../config/cloudinaryConfig');

const generateAndUploadInvoice = async (orderDetails) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });

            // Create a write stream to Cloudinary
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'turant_invoices', resource_type: 'raw', format: 'pdf' },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary PDF Upload Error:', error);
                        reject(new Error('Failed to upload PDF invoice'));
                    } else {
                        resolve(result.secure_url);
                    }
                }
            );

            // Pipe the PDF directly to the Cloudinary stream
            doc.pipe(uploadStream);

            // Basic Invoice Styling with pdfkit
            doc.fillColor('#333333')
                .fontSize(25)
                .text('Turant Logistics', { align: 'center' })
                .fontSize(15)
                .text('Invoice', { align: 'center' })
                .moveDown();

            doc.moveTo(50, 150).lineTo(550, 150).stroke();

            // Order Details
            doc.fontSize(12)
                .text(`Order ID:`, 50, 170)
                .font('Helvetica-Bold').text(`${orderDetails.orderId}`, 150, 170)
                .font('Helvetica');

            doc.text(`Date:`, 50, 190)
                .font('Helvetica-Bold')
                .text(`${new Date(orderDetails.createdAt || Date.now()).toLocaleDateString()}`, 150, 190)
                .font('Helvetica');

            // Addresses
            doc.moveDown(2);
            const startY = doc.y;

            doc.font('Helvetica-Bold').text('From (Sender):', 50, startY);
            doc.font('Helvetica')
                .text(`${orderDetails.senderDetails?.name || 'N/A'}`)
                .text(`${orderDetails.senderDetails?.mobile || 'N/A'}`)
                .text(`${orderDetails.senderDetails?.location?.address || 'N/A'}`, { width: 200 });

            doc.font('Helvetica-Bold').text('To (Receiver):', 300, startY);
            doc.font('Helvetica')
                .text(`${orderDetails.receiverDetails?.name || 'N/A'}`, 300, doc.y)
                .text(`${orderDetails.receiverDetails?.mobile || 'N/A'}`, 300, doc.y)
                .text(`${orderDetails.receiverDetails?.location?.address || 'N/A'}`, 300, doc.y, { width: 250 });

            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Ride specifics
            doc.font('Helvetica-Bold').text('Vehicle:', 50, doc.y);
            doc.font('Helvetica').text(`${orderDetails.vehicleDetails?.vehicleName || 'N/A'} (${orderDetails.vehicleDetails?.vehicleType || 'N/A'})`, 150, doc.y - 12);

            doc.font('Helvetica-Bold').text('Item Weight:', 50, doc.y + 15);
            doc.font('Helvetica').text(`${orderDetails.packageDetails?.weight || 'N/A'}`, 150, doc.y - 12);

            doc.font('Helvetica-Bold').text('Distance:', 50, doc.y + 15);
            doc.font('Helvetica').text(`${orderDetails.distance || 0} km`, 150, doc.y - 12);

            doc.font('Helvetica-Bold').text('Payment Method:', 50, doc.y + 15);
            doc.font('Helvetica').text(`${orderDetails.payment?.method || 'CASH'}`, 150, doc.y - 12);

            doc.font('Helvetica-Bold').text('Payment Status:', 50, doc.y + 15);
            doc.font('Helvetica').text(`${orderDetails.payment?.status || 'COMPLETED'}`, 150, doc.y - 12);

            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Total
            doc.fontSize(16).font('Helvetica-Bold').text('Total Amount:', 50, doc.y);
            doc.fillColor('#22c55e').text(`INR ${orderDetails.pricing?.totalAmount || 0}`, 350, doc.y - 16, { align: 'right' });

            doc.moveDown(3);
            doc.fillColor('#666666')
                .fontSize(10)
                .text('Thank you for trusting Turant Logistics for your delivery needs!', { align: 'center' })
                .text('For support, please visit Address:5th floor, Maurya lok complex, Block A, Fraser Road Area, Patna, Bihar 800001 ', { align: 'center' })
                .text('Email: contact@turantlogistics.com', { align: 'center' })
                .text('Phone: +91 9263283152.', { align: 'center' });
            // Finalize the PDF and end the stream
            doc.end();

        } catch (err) {
            console.error('PDF Generation Error:', err);
            reject(err);
        }
    });
};

module.exports = { generateAndUploadInvoice };
