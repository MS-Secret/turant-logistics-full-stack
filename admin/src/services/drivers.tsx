import Request from "@/config/apiConfig";

const GetDrivers = async (payload: { page?: number; limit?: number }) =>
  Request({
    method: "GET",
    url: "auth/driver/all",
    secure: true,
    params: payload,
  });

const GetDriverById = async (driverId: string) =>
  Request({
    method: "GET",
    url: `auth/driver/${driverId}`,
    secure: true,
  });

const UpdateDriverKycStatus = async (driverId: string, payload:any) =>
  Request({
    method: "post",
    url: `kyc/update-status/${driverId}`,
    secure: true,
    data: payload,
    files: true
  });

const DriversService = {
  GetDrivers,
  GetDriverById,
  UpdateDriverKycStatus,
};

export default DriversService;
