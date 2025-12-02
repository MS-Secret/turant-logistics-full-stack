'use client';
import React from "react";
import DriverDetailsMain from "./driverDetailsMain";
import { useParams } from "next/navigation";

const DriverDetails = () => {
  const params = useParams();
  const id = params.id as string;
  
  return (
    <div>
      <DriverDetailsMain driverId={id} />
    </div>
  );
};

export default DriverDetails;
