"use client";
import React, { createContext, useContext, useState } from "react";

type WithChildProps = {
  children: React.ReactNode;
};

type BillingProviderProps = {
  credits: string;
  tier: string;
  setCredits: React.Dispatch<React.SetStateAction<string>>;
  setTier: React.Dispatch<React.SetStateAction<string>>;
};

const initialValues: BillingProviderProps = {
  credits: "",
  tier: "",
  setCredits: () => {},
  setTier: () => {},
};
const context = createContext<BillingProviderProps>(initialValues);

const { Provider } = context;
export const BillingProvider = ({ children }: WithChildProps) => {
  const [credits, setCredits] = useState(initialValues.credits);
  const [tier, setTier] = useState(initialValues.tier);

  const values = {
    credits,
    setCredits,
    tier,
    setTier,
  };

  return <Provider value={values}>{children}</Provider>;
};

export const useBilling = () => {
    const state= useContext(context);
    if(!state) throw new Error('useBilling must be used within a BillingProvider');
    return state;
}