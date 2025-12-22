import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import React from "react";

type Props = {
  credits: number;
  tier: string;
};

const CreditTracker = ({ credits, tier }: Props) => {
  return (
    <Card className="p-12">
      <CardContent className="flex flex-col gap-6">
        <CardTitle className="font-light">Credits Tracker</CardTitle>
        <Progress
          value={
            tier == "Free" ? credits * 10 : tier == "Unlimited" ? 100 : credits
          }
        />
      </CardContent>
    </Card>
  );
};

export default CreditTracker;
