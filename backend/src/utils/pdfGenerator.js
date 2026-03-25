const PDFDocument = require('pdfkit');
const { cloudinary } = require('../config/cloudinaryConfig');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');

const generateAndUploadInvoice = async (orderDetails) => {
    return new Promise(async (resolve, reject) => {
        try {
            let consumerCity = orderDetails.city;
            if (!consumerCity && orderDetails.userId) {
                const user = await User.findOne({ userId: orderDetails.userId });
                consumerCity = user?.profile?.address?.city || user?.profile?.address?.state;
            }

            const doc = new PDFDocument({ margin: 50, size: 'A4' });

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

            // --- HEADER SECTION ---
            const logoPath = path.join(__dirname, '../../uploads/logo.png');
            if (fs.existsSync(logoPath)) {
                // A4 width is ~595. Center a 100px wide logo: (595 - 100) / 2 = 247.5
                doc.image(logoPath, 247.5, doc.y, { width: 100 });
                doc.y += 85; // Shift Y down to make room for the logo
            } else {
                doc.moveDown(1);
            }

            doc.fillColor('#333333')
                .font('Helvetica-Bold')
                .fontSize(20)
                .text('TURANT LOGISTICS', { align: 'center' });
            
            doc.font('Helvetica-Bold')
                .fontSize(14)
                .text('BOOKING RECEIPT', { align: 'center' })
                .moveDown(1);

            const orderDate = new Date(orderDetails.createdAt || Date.now());
            const dateStr = orderDate.toLocaleDateString();
            const timeStr = orderDate.toLocaleTimeString();

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#555555').text(`Booking Reference: `, 50, doc.y, { continued: true })
               .font('Helvetica-Bold').fillColor('#333333').text(`${orderDetails.orderId}`, { align: 'left' });
            
            doc.font('Helvetica-Bold').fillColor('#555555').text(`Date: `, 50, doc.y, { continued: true })
               .font('Helvetica').fillColor('#333333').text(`${dateStr} | `, { continued: true })
               .font('Helvetica-Bold').fillColor('#555555').text(`Time: `, { continued: true })
               .font('Helvetica').fillColor('#333333').text(`${timeStr}`, { align: 'left' });
            
            doc.moveDown(1.5);

            // Helper to draw section header
            const drawSectionHeader = (title, startY) => {
                let yPos = startY;
                if (yPos > doc.page.height - 150) {
                    doc.addPage();
                    yPos = 50;
                }
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#0052CC').text(title, 50, yPos);
                let currentY = doc.y + 4;
                doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#e5e7eb').lineWidth(1).stroke();
                return currentY + 10;
            };

            // Helper to draw left/right label value grid
            const drawLabelValueGrid = (items, startY) => {
                let currentY = startY;

                for (let i = 0; i < items.length; i += 2) {
                    const item1 = items[i];
                    const item2 = items[i + 1];

                    if (currentY > doc.page.height - 100) {
                        doc.addPage();
                        currentY = 50;
                    }

                    let nextY1 = currentY;
                    let nextY2 = currentY;

                    // Left Column
                    if (item1) {
                        doc.fontSize(10).font('Helvetica-Bold').fillColor('#555555').text(item1.label, 50, currentY, { width: 100 });
                        doc.font('Helvetica').fillColor('#333333').text(item1.value || 'N/A', 160, currentY, { width: 130 });
                        nextY1 = doc.y;
                    }

                    // Right Column
                    if (item2) {
                        doc.fontSize(10).font('Helvetica-Bold').fillColor('#555555').text(item2.label, 310, currentY, { width: 100 });
                        doc.font('Helvetica').fillColor('#333333').text(item2.value || 'N/A', 415, currentY, { width: 130 });
                        nextY2 = doc.y;
                    }

                    currentY = Math.max(nextY1, nextY2) + 8;
                }
                return currentY;
            };

            // --- BOOKING DETAILS ---
            let currentY = drawSectionHeader('BOOKING DETAILS', doc.y);
            
            const bookingItems = [
                { label: 'City:', value: consumerCity || 'N/A' },
                { label: 'Vehicle:', value: `${orderDetails.vehicleDetails?.vehicleName || 'N/A'} (${orderDetails.vehicleDetails?.vehicleType || 'N/A'})` },
                { label: 'Weight:', value: `${orderDetails.packageDetails?.weight || 'N/A'} ${orderDetails.packageDetails?.weightUnit || 'kg'}` },
                { label: 'Distance:', value: `${orderDetails.distance || 0} km` }
            ];

            // If dimensions exist
            if (orderDetails.packageDetails?.length && orderDetails.packageDetails?.width && orderDetails.packageDetails?.height) {
                bookingItems.push({ label: 'Dimensions:', value: `${orderDetails.packageDetails.length} x ${orderDetails.packageDetails.width} x ${orderDetails.packageDetails.height} ${orderDetails.packageDetails.dimensionUnit || 'cm'}` });
            }

            currentY = drawLabelValueGrid(bookingItems, currentY);
            doc.y = currentY;
            doc.moveDown(1);
            
            // --- PICKUP INFORMATION ---
            currentY = drawSectionHeader('PICKUP INFORMATION', doc.y);
            
            const pickupItems = [
                { label: 'Pickup Address:', value: orderDetails.senderDetails?.location?.address || 'N/A' },
                { label: "Sender's Name:", value: orderDetails.senderDetails?.name || 'N/A' },
                { label: "Sender's Phone:", value: orderDetails.senderDetails?.mobile || 'N/A' },
                { label: 'Instructions:', value: orderDetails.senderDetails?.instructions || 'None' }
            ];

            currentY = drawLabelValueGrid(pickupItems, currentY);
            doc.y = currentY;
            doc.moveDown(1);

            // --- DELIVERY INFORMATION ---
            currentY = drawSectionHeader('DELIVERY INFORMATION', doc.y);
            
            const deliveryItems = [
                { label: 'Delivery Address:', value: orderDetails.receiverDetails?.location?.address || 'N/A' },
                { label: "Recipient's Name:", value: orderDetails.receiverDetails?.name || 'N/A' },
                { label: "Recipient's Phone:", value: orderDetails.receiverDetails?.mobile || 'N/A' },
                { label: 'Instructions:', value: orderDetails.receiverDetails?.instructions || 'None' }
            ];

            currentY = drawLabelValueGrid(deliveryItems, currentY);
            doc.y = currentY;
            doc.moveDown(1);

            // --- PAYMENT DETAILS ---
            currentY = drawSectionHeader('PAYMENT DETAILS', doc.y);
            
            let paymentMethodText = 'N/A';
            const method = orderDetails.payment?.method || 'cash';
            if (method.toLowerCase() === 'online') paymentMethodText = 'Online Payment';
            else if (method.toLowerCase() === 'cash' || method.toLowerCase() === 'payatpickup') paymentMethodText = 'Pay at Pickup (Cash or Online)';
            else if (method.toLowerCase() === 'payatdelivery') paymentMethodText = 'Pay at Delivery (Cash or Online)';
            else paymentMethodText = orderDetails.payment?.method;

            const totalAmount = orderDetails.pricing?.totalAmount !== undefined ? orderDetails.pricing.totalAmount : (orderDetails.pricing?.baseFare || 0);

            const paymentItems = [
                { label: 'Payment Method:', value: paymentMethodText },
                { label: 'Payment Status:', value: orderDetails.payment?.status || 'COMPLETED' },
                { label: 'Total Amount:', value: `Rs. ${Number(totalAmount).toFixed(2)}` }
            ];
            
            if (orderDetails.pricing?.waitingCharge && orderDetails.pricing.waitingCharge > 0) {
                paymentItems.push({ label: 'Wait Charges:', value: `Rs. ${Number(orderDetails.pricing.waitingCharge).toFixed(2)}` });
            }

            currentY = drawLabelValueGrid(paymentItems, currentY);
            doc.y = currentY;

            // --- SPECIAL INSTRUCTIONS ---
            if (orderDetails.specialInstructions) {
                doc.moveDown(1);
                currentY = drawSectionHeader('SPECIAL INSTRUCTIONS', doc.y);
                doc.fontSize(10).font('Helvetica').fillColor('#333333').text(orderDetails.specialInstructions, 50, currentY, { width: 495 });
                doc.y = doc.y + 10;
            }

            // --- FOOTER ---
            doc.moveDown(3);
            if (doc.y > doc.page.height - 100) {
                doc.addPage();
                doc.y = 50;
            }
            
            doc.fillColor('#666666')
                .fontSize(10)
                .font('Helvetica')
                .text('Thank you for choosing Turant Logistics!', { align: 'center' })
                .moveDown(0.5)
                .text('For support, contact us at contact@turantlogistics.com', { align: 'center' })
                .moveDown(0.2)
                .text('Address: 5th floor, Maurya lok complex, Block A, Fraser Road Area, Patna, Bihar 800001', { align: 'center' })
                .text('Phone: +91 9263283152', { align: 'center' });

            // Finalize the PDF and end the stream
            doc.end();

        } catch (err) {
            console.error('PDF Generation Error:', err);
            reject(err);
        }
    });
};

module.exports = { generateAndUploadInvoice };
