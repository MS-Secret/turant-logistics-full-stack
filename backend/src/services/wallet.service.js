const Wallet = require("../models/wallet.model");
const Order = require("../models/order.model");
const Pricing = require("../models/pricing.model");
const Driver = require("../models/driver.model");
const User = require("../models/user.model");
const { calculateWeightFare, isCheckNightTime } = require("../utils/orderHelper");
const cashfreeService = require("./cashfree.service");

/**
 * Calculates how much the rider should earn from a completed order.
 * Warning: Hardcoded rates are used here as per requirements.
 */
const calculateRiderEarning = (order, pricing) => {
    const {
        distance,
        weight,
        waitTimeMinutes = 0,
        isReturnTrip = false,
        orderDateTime = new Date(),
        isCOD = false, // Assuming isCOD flag comes from order payload or payment method
        packageDetails,
        payment
    } = order;

    // 1. Calculate Distance Charge (Tiered Payout Logic)
    // Tier 1: 0 to 3.5 km -> Flat ₹28
    // Tier 2: > 3.5 km up to 5.0 km -> ₹8 per km
    // Tier 3: > 5.0 km -> ₹10 per km
    
    let distanceCharge = 0;
    const rideDistance = order.distance || 0;

    if (rideDistance <= 3.5) {
        // Tier 1
        distanceCharge = 28;
    } else if (rideDistance > 3.5 && rideDistance <= 5.0) {
        // Tier 2
        const tier2Dist = rideDistance - 3.5;
        distanceCharge = 28 + (tier2Dist * 8);
    } else if (rideDistance > 5.0) {
        // Tier 3
        const tier3Dist = rideDistance - 5.0;
        // First 3.5km = 28
        // Next 1.5km (up to 5.0) = 1.5 * 8 = 12
        // Total for first 5km = 40
        distanceCharge = 40 + (tier3Dist * 10);
    }

    // 4. Weight Charge (50% to Rider)
    // Calculate full weight fare then divide by 2
    const fullWeightFare = calculateWeightFare(
        parseFloat(packageDetails?.weight || 0),
        pricing.weightSlabs
    );
    const weightCharge = fullWeightFare / 2;

    // 5. Waiting Charge (50% to Rider)
    // Logic: (Total Wait Charge) / 2
    let totalWaitingCharge = 0;
    if (order.waitingInfo?.cost) {
        totalWaitingCharge = order.waitingInfo.cost;
    } else if (waitTimeMinutes > pricing.freeWaitingMinutes) {
        // Fallback calculation if not stored in order
        totalWaitingCharge =
            (waitTimeMinutes - pricing.freeWaitingMinutes) *
            pricing.waitingChargePerMin;
    }
    const waitingCharge = totalWaitingCharge / 2;

    // 6. Fragile/Handling Charge (50% to Rider if applicable)
    let fragileCharge = 0;
    if (
        packageDetails?.packageType === 'Fragile items' ||
        packageDetails?.packageType === 'Cakes' ||
        packageDetails?.packageType === 'cakes'
    ) {
        fragileCharge = 10; // 50% of the ₹20 customer fee
    }

    // 7. Night Surcharge (Fixed ₹15)
    // User prompt: "night sur ₹15". 
    // Real logic usually checks time. 
    const isNight = isCheckNightTime(new Date(orderDateTime));
    const nightCharge = isNight ? 15 : 0;

    // 8. Total Calculation
    // Sum of all components (Distance Tiering handles the minimum ₹28)
    const calculatedEarning = 
        distanceCharge +
        weightCharge +
        waitingCharge +
        nightCharge + 
        fragileCharge;

    return Math.round(calculatedEarning);
};

const createWallet = async (driverId) => {
    try {
        let wallet = await Wallet.findOne({ driver: driverId });
        if (!wallet) {
            wallet = await Wallet.create({ driver: driverId });
        }
        return wallet;
    } catch (error) {
        console.error("Error creating wallet:", error);
        throw error;
    }
};

const getWalletBalance = async (driverId) => {
    try {
        const wallet = await Wallet.findOne({ driver: driverId });
        if (!wallet) return 0;
        return wallet.balance;
    } catch (error) {
        throw error;
    }
};

/**
 * Core function to process payment split after a ride
 */
const processOrderPayment = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) throw new Error("Order not found");

        // Fetch Pricing Model to get Rates & Fuel Type
        let pricing = null;
        if (order.vehicleDetails?.vehicleId) {
            pricing = await Pricing.findById(order.vehicleDetails.vehicleId);
        }

        if (!pricing) {
            console.warn(`[Wallet Service] Pricing model not found or vehicleId missing for Order ${orderId}, using default calculation rates.`);
            pricing = {
                vehicleFuelType: "fuel", // Default to fuel
                minOrderFare: 49,
                weightSlabs: [],
                freeWaitingMinutes: 5,
                waitingChargePerMin: 2
            };
        }

        // 1. Calculate Rider Earning
        const riderEarning = calculateRiderEarning(order, pricing);

        // 2. Fetch Total Fare (Consumer Price)
        // Use finalFare from order (assuming order.pricing.totalAmount or similar stores the final bill)
        const totalFare = order.pricing?.totalAmount || 0;

        // 3. Calculate Company Margin
        const companyMargin = totalFare - riderEarning;

        // 4. Update Wallet
        const driverId = order.driverId; // Assuming driverId is stored as string/ObjectId reference
        // order.driverId is a String pointing to driver.userId, so we query using { userId: driverId }
        const driver = await Driver.findOne({ userId: driverId });
        if (!driver) throw new Error("Driver not found with userId: " + driverId);

        let wallet = await Wallet.findOne({ driver: driver._id });
        if (!wallet) wallet = await createWallet(driver._id);

        // 5. Determine Credit or Debit based on Payment Method
        const paymentMethod = order.payment?.method || "CASH";

        if (paymentMethod === "CASH" || paymentMethod === "COD") {
            // CASE 1: COD / CASH
            // Driver has collected the full 'totalFare' in CASH.
            // Driver keeps 'riderEarning'.
            // Driver owes 'companyMargin' to the company.
            // Action: DEBIT wallet by 'companyMargin'.

            wallet.balance -= companyMargin;
            wallet.transactions.push({
                type: "DEBIT",
                amount: companyMargin,
                description: `Commission deduction for Order #${order.orderId}`,
                orderId: order._id,
                status: "SUCCESS"
            });

        } else {
            // CASE 2: ONLINE
            // Company has collected 'totalFare'.
            // Company owes 'riderEarning' to driver.
            // Action: CREDIT wallet by 'riderEarning'.

            wallet.balance += riderEarning;
            wallet.transactions.push({
                type: "CREDIT",
                amount: riderEarning,
                description: `Earning for Order #${order.orderId}`,
                orderId: order._id,
                status: "SUCCESS"
            });
        }

        await wallet.save();

        // Update Driver Total Earnings statistics
        driver.earnings.totalEarnings += riderEarning;
        driver.earnings.todayEarnings += riderEarning;
        // Note: Weekly/Monthly reset logic would be external cron
        await driver.save();

        return {
            success: true,
            message: "Wallet updated successfully",
            data: {
                newBalance: wallet.balance,
                riderEarning,
                companyMargin,
                transactionType: paymentMethod === "CASH" ? "DEBIT" : "CREDIT"
            }
        };

    } catch (error) {
        console.error("Error processing wallet payment:", error);
        return { success: false, error: error.message };
    }
};

const getHistory = async (driverId) => {
    const wallet = await Wallet.findOne({ driver: driverId }).populate({
        path: 'transactions.orderId',
        select: 'orderId pricing'
    });
    return wallet ? wallet.transactions.reverse() : [];
};

const initiateRecharge = async (driverId, amount, driver) => {
    try {
        const orderId = `RCG_${Date.now()}_${driverId.toString().substring(0, 5)}`;
        // Find user to get phone/email
        const user = await User.findOne({ userId: driver.userId });

        let customerDetails = {
            customerId: driver.userId,
            customerName: user?.username || user?.fullName || "Driver",
            customerEmail: user?.email || "driver@turant.com",
            customerPhone: user?.mobileNumber || "9999999999"
        };

        const cashfreeOrderData = {
            orderId,
            amount: amount,
            currency: "INR",
            customerDetails: customerDetails
        };

        const paymentResponse = await cashfreeService.createOrder(cashfreeOrderData);
        if (!paymentResponse.success) {
            return { success: false, message: "Cashfree order creation failed", error: paymentResponse.error };
        }

        return {
            success: true,
            message: "Recharge session initiated",
            data: {
                sessionId: paymentResponse.data.sessionId,
                orderId: paymentResponse.data.orderId
            }
        };
    } catch (error) {
        console.error("Error initiating recharge:", error);
        return { success: false, message: error.message };
    }
};

const verifyRecharge = async (driverId, orderId) => {
    try {
        // Find or create wallet first
        let wallet = await Wallet.findOne({ driver: driverId });
        if (!wallet) wallet = await createWallet(driverId);

        // Check memory to early fail if already processed
        const isAlreadyProcessed = wallet.transactions.some(tx => tx.description === `Wallet Recharge: ${orderId}`);
        if (isAlreadyProcessed) {
            return { success: true, message: "Wallet recharge already processed", data: { newBalance: wallet.balance } };
        }

        const verificationResponse = await cashfreeService.verifyPayment(orderId);

        if (!verificationResponse.success || !verificationResponse.data || verificationResponse.data.orderStatus !== "PAID") {
            return { success: false, message: `Payment verification failed. Status: ${verificationResponse.data?.orderStatus || "UNKNOWN"}` };
        }

        const amount = Number(verificationResponse.data.paidAmount) || Number(verificationResponse.data.orderAmount) || 0;
        if (amount <= 0) return { success: false, message: "Invalid payment amount detected" };

        // ATOMIC UPDATE to prevent race conditions when multiple onVerify callbacks are fired instantly by SDK
        const updatedWallet = await Wallet.findOneAndUpdate(
            {
                driver: driverId,
                "transactions.description": { $ne: `Wallet Recharge: ${orderId}` }
            },
            {
                $inc: { balance: amount },
                $push: {
                    transactions: {
                        type: "CREDIT",
                        amount: amount,
                        description: `Wallet Recharge: ${orderId}`,
                        status: "SUCCESS"
                    }
                }
            },
            { new: true }
        );

        if (!updatedWallet) {
            // The condition ($ne) failed, meaning it was processed in another concurrent thread
            const finalWallet = await Wallet.findOne({ driver: driverId });
            return { success: true, message: "Wallet recharge already processed", data: { newBalance: finalWallet?.balance || 0 } };
        }

        return {
            success: true,
            message: "Wallet recharged successfully",
            data: { newBalance: updatedWallet.balance }
        };
    } catch (error) {
        console.error("Error verifying recharge:", error);
        return { success: false, message: error.message };
    }
};

const WithdrawalRequest = require("../models/withdrawalRequest.model");

const processWithdrawal = async (driverId, amount, method, bankDetails, upiDetails) => {
    try {
        let wallet = await Wallet.findOne({ driver: driverId });
        if (!wallet) return { success: false, message: "Wallet not found" };

        if (wallet.balance < amount) {
            return { success: false, message: "Insufficient wallet balance" };
        }

        const driver = await Driver.findById(driverId);
        if (!driver) return { success: false, message: "Driver not found" };

        const user = await User.findOne({ userId: driver.userId });

        const parseDetails = (details) => {
            if (!details || details === "undefined" || details === "null") return null;
            if (typeof details === 'string') {
                try { return JSON.parse(details); } catch (e) { return null; }
            }
            return typeof details === 'object' ? details : null;
        };

        // Update withdrawal details if provided
        if (method) {
            const newWithdrawalDetails = { method };

            const parsedBank = parseDetails(bankDetails) || parseDetails(driver.withdrawalDetails?.bankDetails);
            if (parsedBank) newWithdrawalDetails.bankDetails = parsedBank;

            const parsedUpi = parseDetails(upiDetails) || parseDetails(driver.withdrawalDetails?.upiDetails);
            if (parsedUpi) newWithdrawalDetails.upiDetails = parsedUpi;

            // Bypass Mongoose Hydration crash by directly updating the document
            await Driver.updateOne(
                { _id: driverId },
                { $set: { withdrawalDetails: newWithdrawalDetails } }
            );

            driver.withdrawalDetails = newWithdrawalDetails;
        }

        const withdrawInfo = driver.withdrawalDetails;
        if (!withdrawInfo || !withdrawInfo.method) {
            return { success: false, message: "Bank or UPI details missing for withdrawal" };
        }

        const transferIdRef = `WD_${Date.now()}_${driverId.toString().substring(0, 5)}`;

        // Instead of immediate Cashfree request, create a Pending Withdrawal Request
        const withdrawalReq = new WithdrawalRequest({
            driver: driverId,
            amount: amount,
            method: withdrawInfo.method,
            bankDetails: withdrawInfo.method === 'BANK' ? withdrawInfo.bankDetails : undefined,
            upiDetails: withdrawInfo.method === 'UPI' ? withdrawInfo.upiDetails : undefined,
            status: "PENDING"
        });
        await withdrawalReq.save();

        // Lock/Deduct the amount from balance as PENDING
        wallet.balance -= amount;
        wallet.transactions.push({
            type: "DEBIT",
            amount: amount,
            description: `Withdrawal Request (${withdrawInfo.method})`,
            status: "PENDING"
        });

        await wallet.save();

        return {
            success: true,
            message: "Withdrawal request submitted for Admin approval.",
            data: { newBalance: wallet.balance, pendingRequestId: withdrawalReq._id }
        };

    } catch (error) {
        console.error("Error processing withdrawal:", error);
        return { success: false, message: error.message };
    }
};

// --- NEW ADMIN FUNCTIONS ---

const getPendingWithdrawalsAdmin = async () => {
    try {
        const requests = await WithdrawalRequest.find({ status: "PENDING" }).populate("driver").lean();

        // Populate User details manually because Driver.userId is a String, not an ObjectId
        for (let req of requests) {
            if (req.driver && req.driver.userId) {
                const user = await User.findOne({ userId: req.driver.userId }).lean();
                // Attach the user data directly to the driver object for the frontend
                req.driver.userId = user || { fullName: "Unknown", phone: "N/A" };
            }
        }

        return { success: true, data: requests };
    } catch (error) {
        console.error("Error fetching pending withdrawals:", error);
        return { success: false, message: error.message };
    }
};

const approveWithdrawalAdmin = async (requestId) => {
    try {
        const withdrawalReq = await WithdrawalRequest.findById(requestId);
        if (!withdrawalReq) return { success: false, message: "Request not found" };
        if (withdrawalReq.status !== "PENDING") return { success: false, message: "Request is not PENDING" };

        const driver = await Driver.findById(withdrawalReq.driver);
        const user = await User.findOne({ userId: driver.userId });

        // Prepare Beneficiary
        const beneId = `BENE_${driver.userId}`;
        const beneDetails = {
            beneId: beneId,
            name: withdrawalReq.method === 'BANK' ? withdrawalReq.bankDetails?.accountHolderName || user?.fullName : (user?.fullName || "Driver"),
            email: user?.email || "driver@turant.com",
            phone: user?.mobileNumber || "9999999999",
            address1: "Turant Logistics"
        };

        if (withdrawalReq.method === 'BANK') {
            beneDetails.bankAccount = withdrawalReq.bankDetails.accountNumber;
            beneDetails.ifsc = withdrawalReq.bankDetails.ifsc;
        } else {
            beneDetails.vpa = withdrawalReq.upiDetails.upiId;
        }

        // Add Beneficiary to Cashfree
        const beneResult = await cashfreeService.createBeneficiary(beneDetails);
        if (!beneResult.success) {
            return { success: false, message: "Failed to add beneficiary: " + beneResult.error };
        }

        // Request Transfer
        const transferId = `WD_${Date.now()}_${withdrawalReq._id.toString().substring(0, 5)}`;
        const transferDetails = {
            beneId: beneId,
            amount: withdrawalReq.amount.toString(),
            transferId: transferId,
            transferMode: withdrawalReq.method === 'BANK' ? 'IMPS' : 'UPI',
        };

        const transferResult = await cashfreeService.requestTransfer(transferDetails);
        if (!transferResult.success) {
            withdrawalReq.status = "FAILED";
            withdrawalReq.adminNote = "Cashfree Transfer Failed: " + transferResult.error;
            await withdrawalReq.save();
            return { success: false, message: "Transfer failed: " + transferResult.error };
        }

        // Transfer successful
        withdrawalReq.status = "APPROVED";
        withdrawalReq.transferId = transferId;
        await withdrawalReq.save();

        // Mark the transaction in wallet as SUCCESS
        const wallet = await Wallet.findOne({ driver: driver._id });
        if (wallet) {
            const tx = wallet.transactions.find(t =>
                t.amount === withdrawalReq.amount &&
                t.type === "DEBIT" &&
                t.status === "PENDING" &&
                t.description.includes("Withdrawal Request")
            );
            if (tx) {
                tx.status = "SUCCESS";
                tx.description = `Withdrawal (${withdrawalReq.method}): ${transferId}`;
                await wallet.save();
            }
        }

        return { success: true, message: "Withdrawal approved and processed successfully", data: { transferId } };

    } catch (error) {
        console.error("Error approving withdrawal:", error);
        return { success: false, message: error.message };
    }
};

const rejectWithdrawalAdmin = async (requestId, adminNote) => {
    try {
        const withdrawalReq = await WithdrawalRequest.findById(requestId);
        if (!withdrawalReq) return { success: false, message: "Request not found" };
        if (withdrawalReq.status !== "PENDING") return { success: false, message: "Request is not PENDING" };

        withdrawalReq.status = "REJECTED";
        withdrawalReq.adminNote = adminNote || "Rejected by Admin";
        await withdrawalReq.save();

        // Refund the amount to wallet and remove or mark tx as failed
        const wallet = await Wallet.findOne({ driver: withdrawalReq.driver });
        if (wallet) {
            wallet.balance += withdrawalReq.amount; // Refund

            const tx = wallet.transactions.find(t =>
                t.amount === withdrawalReq.amount &&
                t.type === "DEBIT" &&
                t.status === "PENDING" &&
                t.description.includes("Withdrawal Request")
            );

            if (tx) {
                tx.status = "FAILED";
                tx.description = `Withdrawal Rejected: ${adminNote}`;
            } else {
                wallet.transactions.push({
                    type: "CREDIT",
                    amount: withdrawalReq.amount,
                    description: `Refund: Withdrawal Rejected`,
                    status: "SUCCESS"
                });
            }

            await wallet.save();
        }

        return { success: true, message: "Withdrawal rejected and amount refunded" };

    } catch (error) {
        console.error("Error rejecting withdrawal:", error);
        return { success: false, message: error.message };
    }
};

module.exports = {
    createWallet,
    getWalletBalance,
    processOrderPayment,
    getHistory,
    initiateRecharge,
    verifyRecharge,
    processWithdrawal,
    getPendingWithdrawalsAdmin,
    approveWithdrawalAdmin,
    rejectWithdrawalAdmin
};
