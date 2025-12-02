"use client";
import React from "react";
import ConsumerDetailsMain from "./consumerDetailsMain";
import { useParams } from "next/navigation";

const ConsumerDetailPage = () => {
  const params = useParams();
  const id = params.id as string;
  return (
    <div>
      <ConsumerDetailsMain consumerId={id} />
    </div>
  );
};

export default ConsumerDetailPage;
