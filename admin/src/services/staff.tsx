import Request from "@/config/apiConfig";

const GetStaffList = async () =>
  Request({
    method: "GET",
    url: "admin/staff",
    secure: true,
  });

const CreateStaff = async (payload: any) =>
  Request({
    method: "POST",
    url: "admin/staff",
    secure: true,
    data: payload,
  });

const UpdateStaff = async (staffId: string, payload: any) =>
  Request({
    method: "PUT",
    url: `admin/staff/${staffId}`,
    secure: true,
    data: payload,
  });

const DeleteStaff = async (staffId: string) =>
  Request({
    method: "DELETE",
    url: `admin/staff/${staffId}`,
    secure: true,
  });

const StaffService = {
  GetStaffList,
  CreateStaff,
  UpdateStaff,
  DeleteStaff,
};

export default StaffService;
