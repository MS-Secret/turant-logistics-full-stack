import Request from "@/config/apiConfig";

const GetConsumerList=async(payload: { page?: number; limit?: number; search?: string })=>Request({
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

const DeleteConsumer = async (userId: string) => Request({
    url: `auth/consumer/delete/${userId}`,
    method: "DELETE",
    secure: true,
});

const ConsumersService = {
    GetConsumerList,
    GetConsumerById,
    DeleteConsumer,
}

export default ConsumersService;