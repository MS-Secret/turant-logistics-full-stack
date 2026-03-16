const { createBaseSchema } = require('./base.model');
const mongoose = require('mongoose');
const KYCApplicationSchema = createBaseSchema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  owner: {
    name: {
      type: String,
      required: false,
      trim: true,
      minlength: 3,
    },
    aadhaarCard: {
      aadharNumber: {
        type: String,
        required: false,
      },
      frontImageUrl: {
        type: String,
        required: false,
      },
      backImageUrl: {
        type: String,
        required: false,
      }
    },
    panCard: {
      panNumber: {
        type: String,
        required: false,
      },
      imageUrl: {
        type: String,
        required: false,
      }
    },
    ownerPhotoUrl: {
      type: String,
      required: false,
    }
  },
  vehicle: {
    vehicleNumber: {
      type: String,
      required: false,
    },
    vehicleRCImgUrl: {
      type: String,
      required: false,
    },
    vehiclePhotoUrl: {
      type: String,
      required: false,
    },
    operationCity: {
      type: String,
      required: false,
    },
    vehicleType: {
      type: String,
      required: false,
    },
    vehicleBodyDetails: {
      name: {
        type: String,
        required: false,
      },
      length: {
        type: String,
        required: false,
      },
      capacity: {
        type: String,
        required: false,
      }
    },
    vehicleBodyType: {
      type: String,
      required: false,
    },
    vehicleFuelType: {
      type: String,
      required: false,
    },
  },
  driver: {
    name: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    licenseNumber: {
      type: String,
      required: false,
    },
    licenseImageUrl: {
      type: String,
      required: false,
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        required: false,
      },
      accountNumber: {
        type: String,
        required: false,
      },
      ifscCode: {
        type: String,
        required: false,
      },
      passbookImageUrl: {
        type: String,
        required: false,
      }
    }
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  stepCompleted: {
    type: Number,
    required: false,
  }
})

const KYCApplication = mongoose.model('KYCApplication', KYCApplicationSchema);
module.exports = KYCApplication;
