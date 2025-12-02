import Request from "@/config/apiConfig";

const Login=async(payload:any)=>Request({
    method:'POST',
    url:'auth/login',
    data:payload
})

const SendOTP=async(payload:any)=>Request({
    method:'POST',
    url:'auth/send-otp',
    data:payload
})

const VerifyOTP=async(payload:any)=>Request({
    method:'POST',
    url:'auth/verify-otp',
    data:payload
})

const AuthService={
    Login,
    SendOTP,
    VerifyOTP
}

export default AuthService;