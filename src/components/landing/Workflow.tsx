
"use client";

import { motion } from "framer-motion";
import React from "react";
import {
  ShoppingBag,
  BrainCircuit,
  Store,
  Truck,
  MapPin,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const workflowSteps = [
  { icon: ShoppingBag, label: "Customer Order" },
  { icon: BrainCircuit, label: "AI Decision Engine" },
  { icon: Store, label: "Dealer Assignment" },
  { icon: Truck, label: "Smart Fulfillment" },
  { icon: MapPin, label: "Live Tracking" },
  { icon: MessageSquare, label: "Feedback Loop" },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.2,
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20
        }
    }
}

const arrowVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
        pathLength: 1,
        opacity: 0.5,
        transition: {
            duration: 0.7,
            ease: 'easeInOut'
        }
    }
}

export default function WorkflowSection() {
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
          The Anatomy of an AI-Powered Order
        </motion.h2>
        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-4 text-lg leading-8 text-muted-foreground"
        >
          From click to delivery, intelligence is at the core of every step.
        </motion.p>
      </div>
      <motion.div 
        className="relative flex items-center justify-between"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {workflowSteps.map((step, index) => (
          <React.Fragment key={step.label}>
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 text-center w-28 z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/80 border border-border">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
            </motion.div>
            {index < workflowSteps.length - 1 && (
              <div className="hidden sm:block absolute top-8 left-0 w-full h-px -z-0">
                  <svg width="100%" height="100%" className="overflow-visible">
                    <motion.line 
                        x1={`${index * 20 + 12}%`}
                        y1="0"
                        x2={`${(index + 1) * 20 - 12}%`}
                        y2="0"
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        variants={arrowVariants}
                        strokeDasharray="4 4"
                    />
                  </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </motion.div>
    </section>
  );
}
