import Request from "@/config/apiConfig";

const GetConsumerList=async(payload: { page?: number; limit?: number })=>Request({
    url:"auth/consumer/all",
    method:"GET",
    secure: true,
    params: payload,
});

const GetConsumerById=async(consumerId:string)=>Request({
    url:`auth/consumer/${consumerId}`,
    method:"GET",
    secure: true,
});

const ConsumersService={
    GetConsumerList,
    GetConsumerById,
}

export default ConsumersService;