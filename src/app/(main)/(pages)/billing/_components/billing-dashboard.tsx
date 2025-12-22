"use client";
import React, { useEffect, useState } from "react";
import SubscriptionCard from "./subscription-card";
import axios from "axios";
import { useBilling } from "@/providers/billing-providers";
import CreditTracker from "./credits-tracker";

const BillingDashboard = () => {
  const { credits, tier } = useBilling();
  const [stripeProducts, setStripeProducts] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const onStripeProducts = async () => {
    const { data } = await axios.get("/api/payment");
    if (data) {
      setStripeProducts(data);
      setLoading(false);
    }
  };
  useEffect(() => {
    onStripeProducts();
  }, []);

  const onPayment = async (id: string) => {
    const { data } = await axios.post(
      "/api/payment",
      { priceId: id },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    window.location.assign(data);
  };
  return (
    <>
      <div className="flex gap-5 p-6">
        <SubscriptionCard
          onPayment={onPayment}
          tier={tier}
          products={stripeProducts}
        />
      </div>
        <CreditTracker tier={tier} credits={parseInt(credits)} />
    </>
  );
};

export default BillingDashboard;
