import Request from "@/config/apiConfig";

const GetAllOrders=async({page,limit}:{
    page:number,
    limit:number
})=>Request({
    url:'orders',
    method:'GET',
    secure:true,
    params:{
        page,
        limit
    }
})

const OrderServices={
    GetAllOrders
}
export default OrderServices;