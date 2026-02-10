
"use client";

import { motion } from "framer-motion";
import React from "react";

const Dot = ({
  duration,
  size,
  x,
  y,
}: {
  duration: number;
  size: number;
  x: string;
  y: string;
}) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      left: x,
      top: y,
      background: "radial-gradient(circle, hsl(var(--accent)) 0%, hsl(var(--accent) / 0) 60%)",
    }}
    animate={{
      opacity: [0, 1, 1, 0],
      scale: [0.5, 1, 1, 0.5],
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay: Math.random() * duration,
    }}
  />
);

export default function HeatmapSection() {
  const dots = React.useMemo(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      duration: 2 + Math.random() * 3,
      size: 2 + Math.random() * 5,
      x: `${5 + Math.random() * 90}%`,
      y: `${10 + Math.random() * 80}%`,
    })),
  []);

  return (
    <section className="py-24 sm:py-32">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-2xl bg-secondary p-8 sm:p-16"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.15)_0,_transparent_50%)]" />
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,white_20%,transparent_80%)]">
            {dots.map((dot) => <Dot key={dot.id} {...dot} />)}
          </div>
        </div>

        <div className="relative z-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl text-glow">
            Zone-Based AI Demand Intelligence
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Visualize demand hotspots in real-time, predict regional trends, and
            optimize stock allocation across your entire dealer network.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
