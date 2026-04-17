const Driver = require("../models/driver.model");
const Wallet = require("../models/wallet.model");
const IncentiveTracker = require("../models/incentive.model");
const Referral = require("../models/referral.model");
const mongoose = require("mongoose");
const Order = require("../models/order.model");

const generateReferralCode = async (driverUserId) => {
  try {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = 'ZD-';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const existingDriver = await Driver.findOne({ referralCode: code });
      if (!existingDriver) {
        isUnique = true;
      }
    }

    await Driver.findOneAndUpdate({ userId: driverUserId }, { referralCode: code });
    return code;
  } catch (error) {
    console.error("Error generating referral code:", error);
    throw error;
  }
};
//Link new driver with referrer
const applyReferralCode = async (referredUserId, referralCode) => {
  try {
    if (!referralCode) return;

    const referrer = await Driver.findOne({ referralCode });
    if (!referrer) {
      console.warn(`Invalid referral code used: ${referralCode}`);
      return;
    }

    const referredDriver = await Driver.findOne({ userId: referredUserId });
    if (!referredDriver) {
      console.warn(`Referred driver not found: ${referredUserId}`);
      return;
    }

    // Prevent self-referral
    if (referrer.userId === referredUserId) {
      console.warn(`Self-referral attempted by ${referredUserId}`);
      return;
    }

    // Check if already referred
    const existingReferral = await Referral.findOne({ referredUser: referredDriver._id });
    if (existingReferral) {
      console.warn(`Driver ${referredUserId} was already referred.`);
      return;
    }

    // Create referral record
    await Referral.create({
      referrer: referrer._id,
      referredUser: referredDriver._id,
      referralCode: referralCode,
      status: 'ACTIVE'
    });

    // Update referred driver's profile
    referredDriver.referredBy = referralCode;
    await referredDriver.save();

    // Increment referrer's referral count
    referrer.referralCount += 1;
    await referrer.save();

    console.log(`Referral link created: ${referrer.userId} referred ${referredUserId}`);
  } catch (error) {
    console.error("Error applying referral code:", error);
  }
};

/**
 * Checks and credits incentives for completed orders (₹100 for every 10 orders).
 */
const checkAndCreditOrderIncentive = async (driverObjectId) => {
  try {
    const driver = await Driver.findById(driverObjectId);
    if (!driver) return;

    // Get number of completed orders
    const completedOrdersCount = await Order.countDocuments({
      driverId: driver.userId,
      status: 'COMPLETED'
    });

    let tracker = await IncentiveTracker.findOne({ driver: driverObjectId });
    if (!tracker) {
      // Initialize lastIncentiveAt to current order count so past orders
      // before the incentive system was integrated don't trigger retroactive rewards.
      // Incentives only count for NEW orders going forward.
      const currentMilestone = Math.floor(completedOrdersCount / 10) * 10;
      tracker = await IncentiveTracker.create({
        driver: driverObjectId,
        totalCompletedOrders: completedOrdersCount,
        lastIncentiveAt: currentMilestone
      });
      console.log(`New IncentiveTracker created for driver ${driver.userId} with baseline at ${currentMilestone} orders`);
    }

    tracker.totalCompletedOrders = completedOrdersCount;

    // Logic: for every 10 orders, ₹100.
    // We check if (floor(count/10) * 10) > lastIncentiveAt
    const currentMilestoneTier = Math.floor(completedOrdersCount / 10);
    const lastMilestoneTier = Math.floor(tracker.lastIncentiveAt / 10);

    if (currentMilestoneTier > lastMilestoneTier) {
      const incentiveAmount = 100;
      const milestone = currentMilestoneTier * 10;

      // Credit Wallet
      let wallet = await Wallet.findOne({ driver: driverObjectId });
      if (!wallet) {
        wallet = await Wallet.create({ driver: driverObjectId });
      }

      wallet.balance += incentiveAmount;
      const transactionId = `INC_${Date.now()}_${milestone}`;
      
      wallet.transactions.push({
        type: "CREDIT",
        amount: incentiveAmount,
        description: `Order Milestone Incentive (10 orders completed)`,
        status: "SUCCESS",
        date: new Date()
      });

      await wallet.save();

      // Update Tracker
      tracker.lastIncentiveAt = milestone;
      tracker.incentiveHistory.push({
        milestone: milestone,
        amount: incentiveAmount,
        walletTransactionId: transactionId
      });

      await tracker.save();

      console.log(`Incentive credited to driver ${driver.userId}: ₹${incentiveAmount} for milestone ${milestone}`);
    } else {
      await tracker.save();
    }
  } catch (error) {
    console.error("Error in checkAndCreditOrderIncentive:", error);
  }
};

/**
 * Checks and credits referral rewards when a referred rider hits milestones.
 * Referred rider completes 5 orders -> referrer earns ₹50
 * Referred rider completes 25 orders -> referrer earns additional ₹200
 */
const checkAndCreditReferralRewards = async (referredDriverUserId) => {
  try {
    const referredDriver = await Driver.findOne({ userId: referredDriverUserId });
    if (!referredDriver) return;

    const referral = await Referral.findOne({ referredUser: referredDriver._id });
    if (!referral) return;

    const completedOrdersCount = await Order.countDocuments({
      driverId: referredDriverUserId,
      status: 'COMPLETED'
    });

    let walletUpdated = false;
    let referrerWallet = null;

    const getReferrerWallet = async () => {
      if (referrerWallet) return referrerWallet;
      referrerWallet = await Wallet.findOne({ driver: referral.referrer });
      if (!referrerWallet) {
        referrerWallet = await Wallet.create({ driver: referral.referrer });
      }
      return referrerWallet;
    };

    // Milestone 1: 5 orders -> ₹50
    if (completedOrdersCount >= 5 && !referral.milestones.fiveOrders.completed) {
      const wallet = await getReferrerWallet();
      wallet.balance += referral.milestones.fiveOrders.amount;
      wallet.transactions.push({
        type: "CREDIT",
        amount: referral.milestones.fiveOrders.amount,
        description: `Referral Reward: Referred rider completed 5 orders`,
        status: "SUCCESS"
      });
      walletUpdated = true;

      referral.milestones.fiveOrders.completed = true;
      referral.milestones.fiveOrders.completedAt = new Date();
    }

    // Milestone 2: 25 orders -> ₹200
    if (completedOrdersCount >= 25 && !referral.milestones.twentyFiveOrders.completed) {
      const wallet = await getReferrerWallet();
      wallet.balance += referral.milestones.twentyFiveOrders.amount;
      wallet.transactions.push({
        type: "CREDIT",
        amount: referral.milestones.twentyFiveOrders.amount,
        description: `Referral Reward: Referred rider completed 25 orders`,
        status: "SUCCESS"
      });
      walletUpdated = true;

      referral.milestones.twentyFiveOrders.completed = true;
      referral.milestones.twentyFiveOrders.completedAt = new Date();
      referral.status = 'COMPLETED';
    }

    if (walletUpdated && referrerWallet) {
      await referrerWallet.save();
      await referral.save();
      console.log(`Referral rewards updated for referrer of driver ${referredDriverUserId}`);
    }
  } catch (error) {
    console.error("Error in checkAndCreditReferralRewards:", error);
  }
};

/**
 * Get stats for a driver.
 */
const getDriverIncentiveStats = async (driverUserId) => {
    const driver = await Driver.findOne({ userId: driverUserId });
    if (!driver) throw new Error("Driver not found");

    const tracker = await IncentiveTracker.findOne({ driver: driver._id });
    const referral = await Referral.find({ referrer: driver._id }).populate('referredUser');

    const completedOrders = tracker?.totalCompletedOrders || 0;
    const lastMilestone = tracker?.lastIncentiveAt || 0;
    const nextMilestone = (Math.floor(completedOrders / 10) + 1) * 10;
    const ordersSinceLastMilestone = completedOrders - lastMilestone;
    const ordersToNextMilestone = nextMilestone - completedOrders;
    const progressPercent = Math.min(((ordersSinceLastMilestone % 10) / 10) * 100, 100);

    return {
        completedOrders,
        lastMilestone,
        nextMilestone,
        ordersToNextMilestone,
        progressPercent,
        ordersSinceLastMilestone: ordersSinceLastMilestone % 10,
        incentivesEarned: tracker?.incentiveHistory?.reduce((sum, item) => sum + item.amount, 0) || 0,
        referralCode: driver.referralCode,
        referralCount: driver.referralCount,
        referrals: referral.map(r => ({
            status: r.status,
            fiveOrders: r.milestones.fiveOrders.completed,
            twentyFiveOrders: r.milestones.twentyFiveOrders.completed
        }))
    };
};

module.exports = {
  generateReferralCode,
  applyReferralCode,
  checkAndCreditOrderIncentive,
  checkAndCreditReferralRewards,
  getDriverIncentiveStats
};
