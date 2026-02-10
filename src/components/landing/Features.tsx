
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
      className="relative h-full"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <div
        className={cn(
          "relative h-full w-full rounded-2xl p-6 sm:p-8 card-glass border border-border/20 overflow-hidden"
        )}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            boxShadow: isHovered
              ? "0 0 30px 5px hsl(var(--primary)/0.2), inset 0 0 15px hsl(var(--primary)/0.1)"
              : "0 0 0px 0px hsl(var(--primary)/0), inset 0 0 0px hsl(var(--primary)/0)",
          }}
          transition={{ duration: 0.3 }}
        />
        <div className="relative z-10">
          <motion.div 
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
            animate={{ scale: isHovered ? 1.15 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <feature.Icon className="h-6 w-6" />
          </motion.div>
          <h3 className="mt-6 text-lg font-semibold text-white">
            {feature.title}
          </h3>
          <p className="mt-2 text-base text-muted-foreground">
            {feature.description}
          </p>
        </div>
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
