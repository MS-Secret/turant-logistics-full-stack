import Request from "@/config/apiConfig";

const GetAllOrders = async ({ page, limit }: {
    page: number,
    limit: number
}) => Request({
    url: 'orders',
    method: 'GET',
    secure: true,
    params: {
        page,
        limit
    }
})


const ForceCancelOrder = async (orderId: string, reason: string) => Request({
    url: `orders/admin/${orderId}/force-cancel`,
    method: 'POST',
    secure: true,
    data: {
        reason
    }
})

const OrderServices = {
    GetAllOrders,
    ForceCancelOrder
}
export default OrderServices;