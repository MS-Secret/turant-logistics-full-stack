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

const BlockDriver = async (userId: string) =>
  Request({
    method: "POST",
    url: `auth/driver/block/${userId}`,
    secure: true,
  });

const UnblockDriver = async (userId: string) =>
  Request({
    method: "POST",
    url: `auth/driver/unblock/${userId}`,
    secure: true,
  });

const DeleteDriver = async (userId: string) =>
  Request({
    method: "DELETE",
    url: `auth/driver/delete/${userId}`,
    secure: true,
  });

const DriversService = {
  GetDrivers,
  GetDriverById,
  UpdateDriverKycStatus,
  BlockDriver,
  UnblockDriver,
  DeleteDriver,
};

export default DriversService;
