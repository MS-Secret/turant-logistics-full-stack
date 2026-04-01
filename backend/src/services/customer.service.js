const httpStatusCode = require("../constants/httpStatusCode");
const Consumer = require("../models/consumer.model");
const User = require("../models/user.model");

const GetCustomerList = async (payload) => {
  try {
    const { page, limit, search } = payload;
    let consumerQuery = {};

    // Base pagination logic
    const skip = (page - 1) * limit;

    // Handle Search filter
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search, "i");
      
      // Since Consumer and User are separate models, we first find matching Users based on username, email, or phone
      const matchingUsers = await User.find({
         $or: [
           { username: searchRegex },
           { email: searchRegex },
           { phone: searchRegex },
           { fullName: searchRegex },
         ]
      }).select("userId");
      
      const matchingUserIds = matchingUsers.map((user) => user.userId);
      consumerQuery = { userId: { $in: matchingUserIds } };
    }

    const customers = await Consumer.find(consumerQuery)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    if (!customers || customers.length === 0) {
      return {
        success: true, // Returning true with empty data is better for frontend than false
        message: "No customers found",
        data: {
          totalConsumers: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit,
          consumers: [],
        },
      };
    }

    const customerDetailsPromises = customers.map(async (customer) => {
      const user = await User.find({
        userId: customer?.userId,
      });
      return { ...customer.toObject(), user: user[0] };
    });
    const customerDetails = await Promise.all(customerDetailsPromises);

    const totalCustomers = await Consumer.countDocuments(consumerQuery);
    const totalPages = Math.ceil(totalCustomers / limit);
    const currentPage = page;
    const pageSize = limit;

    return {
      success: true,
      message: "Consumer list fetched successfully",
      data: {
        totalConsumers: totalCustomers,
        totalPages,
        currentPage,
        pageSize,
        consumers: customerDetails,
      },
    };
  } catch (error) {
    console.error("Error in GetCustomerList:", error);
    return {
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    };
  }
};

const GetCustomerDetails = async ({consumerId}) => {
  try {
    const customer=await Consumer.findById(consumerId);
    if(!customer){
        return {
            success:false,
            message:"Consumer not find",
            data:null
        }
    }
    const user=await User.find({
        userId:customer?.userId
    });
    if(!user){
        return {
            success:false,
            message:"User not find",
            data:null
        }
    }
    const data={
        ...customer.toObject(),
        user:user[0]
    }

    return {
        success:true,
        message:"Consumer details fetched successfully",
        data
    }

  } catch (error) {
    console.log("error while getting customer details:", error);
    return {
      success: false,
      message: "An error occurred while processing the request.",
      error: error.message,
    };
  }
};

module.exports = {
  GetCustomerList,
  GetCustomerDetails
};
