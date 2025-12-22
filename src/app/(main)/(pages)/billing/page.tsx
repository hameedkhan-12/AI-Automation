import React from "react";
import BillingDashboard from "./_components/billing-dashboard";

type Props = {
  searchParams?: { [key: string]: string | undefined };
};

const page = async ({ searchParams }: Props) => {
  const { session_id } = searchParams ?? {
    session_id: "",
  };
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl sticky top-0 z-10 p-6 bg-background-50 backdrop-blur-lg flex items-center border-b">
        Billing
      </h1>

      <BillingDashboard />
    </div>
  );
};

export default page;
