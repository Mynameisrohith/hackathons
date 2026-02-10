
"use client";

import { motion } from "framer-motion";
import { DollarSign, Package, ShieldAlert, Truck, Users } from "lucide-react";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import NumberTicker from "./NumberTicker";
import ShineBorder from "./ShineBorder";

interface Metrics {
  totalRevenue: number;
  totalOrders: number;
  activeDealers: number;
  fraudAlerts: number;
  avgDeliveryTime: number;
}

interface MetricsSectionProps {
  metrics: Metrics;
  isLoading: boolean;
}

const metricItems = (metrics: Metrics) => [
  { icon: DollarSign, label: "Total Revenue", value: metrics.totalRevenue, isCurrency: true },
  { icon: Package, label: "Orders Processed", value: metrics.totalOrders },
  { icon: Users, label: "Active Dealers", value: metrics.activeDealers },
  { icon: ShieldAlert, label: "Fraud Alerts", value: metrics.fraudAlerts },
  { icon: Truck, label: "Avg. Delivery Time", value: metrics.avgDeliveryTime, unit: "min" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const MetricCard = ({
  item,
}: {
  item: { icon: React.ElementType; label: string; value: number; isCurrency?: boolean, unit?: string };
}) => {
  return (
    <ShineBorder
      className="p-6 text-center"
      color={["#2dd4bf", "#3b82f6", "#8b5cf6"]}
    >
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <item.icon className="h-7 w-7" />
        </div>
      </div>
      <h3 className="text-4xl font-bold tracking-tighter text-white">
        {item.isCurrency && "$"}
        <NumberTicker value={item.value} />
        {item.unit && <span className="text-2xl"> {item.unit}</span>}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
    </ShineBorder>
  );
};

export default function MetricsSection({ metrics, isLoading }: MetricsSectionProps) {
  if (isLoading) {
    return (
      <section className="py-24 sm:py-32">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 sm:py-32">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        {metricItems(metrics).map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </motion.div>
    </section>
  );
}
