import Request from "@/config/apiConfig";

const CreatePricing = async (payload: any) =>
  Request({
    url: "orders/pricing",
    method: "POST",
    data: payload,
    files: true,
    secure: true,
  });
const GetAllPricing = async () =>
  Request({
    url: "orders/pricing",
    method: "GET",
    secure: true,
  });

const GetSinglePricing = async (id: any) =>
  Request({
    url: `orders/pricing/${id}`,
    method: "GET",
    secure: true,
  });
const DeletePricing = async (id: any) =>
  Request({
    url: `orders/pricing/${id}`,
    method: "DELETE",
    secure: true,
  });

const PricingService = {
  CreatePricing,
  GetAllPricing,
  GetSinglePricing,
  DeletePricing,
};

export default PricingService;
