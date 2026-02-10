
"use client";

import { motion } from "framer-motion";
import { Server, ShieldCheck, Route, Bot } from "lucide-react";
import React from "react";
import { Badge } from "../ui/badge";

const trustItems = [
  {
    Icon: Server,
    title: "Scalable Cloud Infrastructure",
    description: "Built on a robust, auto-scaling architecture to handle peak demand without compromising performance.",
  },
  {
    Icon: ShieldCheck,
    title: "Secure Role-Based System",
    description: "Granular access control ensures that users, dealers, and admins only see what they need to.",
  },
  {
    Icon: Bot,
    title: "AI-Powered Fraud Shield",
    description: "Our proprietary models work 24/7 to detect and neutralize threats before they impact your business.",
  },
  {
    Icon: Route,
    title: "Real-Time Dealer Network",
    description: "A dynamic network that optimizes for speed and efficiency, from urban centers to remote locations.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function TrustSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="grid grid-cols-1 items-center gap-x-16 gap-y-16 lg:grid-cols-2">
        <div>
          <Badge variant="outline" className="mb-4">Enterprise Grade</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trust & Scale
          </h2>
          <p className="mt-4 text-muted-foreground">
            Our platform is engineered for reliability, security, and
            unprecedented scale. We provide the enterprise-grade foundation you
            need to grow with confidence.
          </p>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {trustItems.map((item) => (
            <motion.div key={item.title} variants={itemVariants}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.Icon className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
