import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";

type Props = {
  onPayment: (id: string) => void;
  products: any[];
  tier: any;
};
const SubscriptionCard = ({ onPayment, products, tier }: Props) => {
  return (
    <section className="flex w-full justify-center md:flex-row flex-col gap-6">
      {products.map((product) => (
        <Card className="p-3" key={product.id}>
          <CardHeader>
            <CardTitle>{product.nickname}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {product.nickname == "Unlimited"
                ? "Enjoy a monthly torrent of credits flooding your account, empowering you to tackle even the most ambitious automation tasks effortlessly."
                : product.nickname == "Pro"
                ? "Experience a monthly surge of credits to supercharge your automation efforts. Ideal for small to medium-sized projects seeking consistent support."
                : product.nickname == "Free" &&
                  "Get a monthly wave of credits to automate your tasks with ease. Perfect for starters looking to dip their toes into Fuzzie's automation capabilities."}
            </CardDescription>
            <div>
              <p>
                {product.nickname == "Free"
                  ? "10"
                  : product.nickname == "Pro"
                  ? "100"
                  : "Unlimited"}{" "}
                Credits
              </p>
              <p>
                {product.nickname == "Free"
                  ? "Free"
                  : product.nickname == "Pro"
                  ? "29.99"
                  : product.nickname == "Unlimited" && "99.99"}
                /mo
              </p>
            </div>
            {product.nickname == tier ? (
              <Button disabled variant={"outline"}>
                Active
              </Button>
            ) : (
              <Button onClick={() => onPayment(product.id)} variant={"outline"}>
                Purchase
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  );
};

export default SubscriptionCard;
