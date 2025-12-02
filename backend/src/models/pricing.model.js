const mongoose=require("mongoose");
const { baseSchema, createBaseSchema } = require("./base.model");

/**
 * Pricing Formula (App Calculation Flow):
 * 1. Calculate Order Fare = Max(Min Order Fare, Base Fare + Distance Fare + Weight Fare)
 * 2. Add Platform Surcharge = Order Fare × 12% (or configured %)
 * 3. Apply Discount = Based on active promo (flat or %)
 * 4. Add Waiting Charge = ₹2 × (Wait Minutes - 5)
 * 5. Add Optional Charges (Return Trip / Night Surcharge / COD)
 * 6. Total Fare = Order Fare + Surcharge + Optional - Discount
 * 7. Round Total Fare to nearest ₹1 (App Fare)
 */

const PricingSchema =createBaseSchema({
    // Vehicle Information
    vehicleType:{
        type:String,
        required:true,
        enum: ['2 Wheeler', '3 Wheeler (Passenger Auto/e-rickshaw)', '3 wheeler', 'Piaggio like model', '4 wheeler', 'Tata Ace like (upto 1500 kg)', 'Mahindra like (upto 2 Ton)', 'Intercity']
    },
    vehicleName:{
        type:String,
        required:true,
    },
    vehicleImageUrl:{
        type:String,
        required:false,
    },
    vehicleBodyDetails:{
      name:{
        type:String,
        required:false,
      },
      length:{
        type:String,
        required:false,
      },
      capacity:{
        type:String,
        required:false,
      }
    },
    vehicleBodyType:{
      type:String,
      required:false,
    },
    vehicleFuelType:{
      type:String,
      required:false,
    },

    // Base Pricing
    minOrderFare:{
        type:Number,
        required:true
    },
    
    // Distance-based Pricing
    distanceSlabs:[{
        minDistance: {
            type: Number,
            required: true
        },
        maxDistance: {
            type: Number,
            required: false // null for unlimited
        },
        farePerKm: {
            type: Number,
            required: true
        }
    }],
    
    // Weight-based Pricing
    weightSlabs:[{
        minWeight: {
            type: Number,
            required: true
        },
        maxWeight: {
            type: Number,
            required: false // null for unlimited
        },
        farePerKg: {
            type: Number,
            required: true,
            default: 0
        }
    }],
    
    // Platform Charges
    platformSurchargePercentage:{
        type: Number,
        required: true,
        default: 12 // 12% as per table
    },
    
    // Discounts and Promotions
    discountPercentage:{
        type: Number,
        required: false,
        default: 0
    },
    promoCode:{
        type: String,
        required: false
    },
    
    // Waiting Charges
    waitingChargePerMin:{
        type: Number,
        required: true,
        default: 2 // ₹2 per minute after 5 minutes
    },
    freeWaitingMinutes:{
        type: Number,
        required: true,
        default: 5 // First 5 minutes free
    },
    
    // Optional Charges
    returnTripFeePercentage:{
        type: Number,
        required: false,
        default: 70 // 70% of base fare if customer requests pickup + return
    },
    nightSurchargePercentage:{
        type: Number,
        required: false,
        default: 10 // 10% night surcharge (9pm to 7am)
    },
    codHandlingFee:{
        type: Number,
        required: false,
        default: 10 // ₹10-20 for cash fragile items loading/offloading
    },
    
    // Loading/Offloading charges
    loadingCharge:{
        type: Number,
        required: false,
        default: 0
    },
    offloadingCharge:{
        type: Number,
        required: false,
        default: 0
    },
    
    // Extra charges for hands
    extraHandsCharge:{
        type: Number,
        required: false,
        default: 100 // ₹100 for extra hands
    },
    
    // Status flags
    isActive:{
        type:Boolean,
        required:false,
        default:true
    },
    isDelete:{
        type:Boolean,
        required:false,
        default:false
    }
    
})

module.exports=mongoose.model("Pricing",PricingSchema);