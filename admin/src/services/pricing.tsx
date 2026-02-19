import Request from "@/config/apiConfig";

const CreatePricing = async (payload: any) =>
  Request({
    url: "pricing",
    method: "POST",
    data: payload,
    files: true,
    secure: true,
  });
const GetAllPricing = async () =>
  Request({
    url: "pricing",
    method: "GET",
    secure: true,
  });

const GetSinglePricing = async (id: any) =>
  Request({
    url: `pricing/${id}`,
    method: "GET",
    secure: true,
  });
const DeletePricing = async (id: any) =>
  Request({
    url: `pricing/${id}`,
    method: "DELETE",
    secure: true,
  });

const UpdatePricing = async (id: any, payload: any) =>
  Request({
    url: `pricing/${id}`,
    method: "PUT",
    data: payload,
    files: true,
    secure: true,
  });

const PricingService = {
  CreatePricing,
  GetAllPricing,
  GetSinglePricing,
  DeletePricing,
  UpdatePricing,
};

export default PricingService;
