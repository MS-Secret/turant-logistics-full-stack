import toast from "react-hot-toast";
import axios from "axios";
const Request = async (httpOptions: any) => {

  const token = localStorage.getItem("accessToken");
  if (!httpOptions.exact) {
    httpOptions.url = process.env.NEXT_PUBLIC_API_URL + "/" + httpOptions.url;
  }
  const headers = {
    Accept: "application/json",
    ...httpOptions.headers,
  };

  if (!httpOptions.files) {
    headers["Content-Type"] = "application/json";
  }

  httpOptions.headers = headers;
  if (httpOptions.secure) {
    httpOptions.headers.Authorization = `Bearer ${token}`;
  }

  const handleRequestErrors = (error: any) => {
    if (error.response) {
      const { status, data } = error?.response;
      console.log("error response", data);
      if (status === 401 && data?.message === "Unauthorized: Invalid token") {

        window.location.replace("/login");
      } else if (status == 413) {
        toast.error("File size exceeds the limit");
      }
    } else if (error.request) {
      console.log("error request", error.request);
    } else {
      console.log("error message", error.message);
    }
  };

  return axios(httpOptions)
    .then((response: any) => response)
    .catch((error: any) => {
      handleRequestErrors(error);
      throw error?.response || error;
    });
};

export default Request;