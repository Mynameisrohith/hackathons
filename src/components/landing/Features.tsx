
"use client";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  ShieldCheck,
  Map,
  Truck,
  Mic,
  Warehouse,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const features = [
  {
    Icon: BrainCircuit,
    title: "AI Demand Forecasting",
    description: "Predict trends and stock up before demand surges.",
  },
  {
    Icon: ShieldCheck,
    title: "Fraud Detection Engine",
    description: "Protect your marketplace with real-time risk analysis.",
  },
  {
    Icon: Map,
    title: "Smart Dealer Assignment",
    description: "Optimize logistics by assigning orders to the nearest dealer.",
  },
  {
    Icon: Truck,
    title: "Real-Time Logistics AI",
    description: "Dynamic routing and ETA predictions for every delivery.",
  },
  {
    Icon: Mic,
    title: "Voice Commerce",
    description: "Engage users with voice commands in Hindi & Kannada.",
  },
  {
    Icon: Warehouse,
    title: "Inventory Optimization",
    description: "Minimize waste and maximize sales with AI-powered suggestions.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const FeatureCard = ({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      variants={cardVariants}
      className="relative rounded-2xl p-px"
      style={{
        background: "radial-gradient(40% 40% at 50% 50%, hsl(var(--primary)/0.2), transparent)",
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "h-full w-full rounded-[15px] p-6 sm:p-8",
          "card-glass border-transparent"
        )}
      >
        <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <feature.Icon className="h-6 w-6" />
          <motion.div
            className="absolute inset-0 rounded-lg"
            animate={{
              boxShadow: isHovered
                ? "0 0 20px hsl(var(--primary)/0.5)"
                : "0 0 0px hsl(var(--primary)/0)",
            }}
          />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-white">
          {feature.title}
        </h3>
        <p className="mt-2 text-base text-muted-foreground">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
};

export default function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="text-center mb-16">
        <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-white sm:text-5xl"
        >
          Built for the Future of Commerce
        </motion.h2>
        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-4 text-lg leading-8 text-muted-foreground"
        >
          Our AI-powered modules work together to create a seamless, intelligent ecosystem.
        </motion.p>
      </div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </motion.div>
    </section>
  );
}
