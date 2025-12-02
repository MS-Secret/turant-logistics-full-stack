"use client";
import { useRouter } from "next/navigation";
import Login from "./login/page";
import { useEffect } from "react";

export default function Home() {
  const router=useRouter();
  useEffect(()=>{
    const token=localStorage.getItem('accessToken');
    if(token){
      router.push('/dashboard')
    }
  },[])
  return (
    <div>
      <Login/>
    </div>
  );
}
