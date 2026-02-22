import Request from "@/config/apiConfig";

const CreateCampaign = async (payload: any) =>
    Request({
        url: "campaigns",
        method: "POST",
        data: payload,
        files: true,
        secure: true,
    });

const GetAllCampaigns = async () =>
    Request({
        url: "campaigns",
        method: "GET",
        secure: true,
    });

const DeleteCampaign = async (id: any) =>
    Request({
        url: `campaigns/${id}`,
        method: "DELETE",
        secure: true,
    });


const CampaignService = {
    CreateCampaign,
    GetAllCampaigns,
    DeleteCampaign
};

export default CampaignService;
