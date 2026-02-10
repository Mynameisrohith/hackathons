
"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Link from 'next/link';
import { Button } from "../ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const AnimatedNeuralNetwork = () => (
    <motion.svg
      width="100%"
      height="100%"
      viewBox="0 0 800 800"
      initial="hidden"
      animate="visible"
      className="absolute inset-0 z-0 h-full w-full opacity-10 [mask-image:radial-gradient(closest-side,white,transparent)]"
    >
      <g>
        {[...Array(7)].map((_, i) => (
          <motion.circle
            key={`c1-${i}`}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 0.5, transition: { delay: i * 0.1 } },
            }}
            cx={100}
            cy={100 + i * 100}
            r={10}
            fill="hsl(var(--primary))"
          />
        ))}
         {[...Array(5)].map((_, i) => (
          <motion.circle
            key={`c2-${i}`}
             variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 0.5, transition: { delay: 0.5 + i * 0.1 } },
            }}
            cx={400}
            cy={200 + i * 100}
            r={15}
            fill="hsl(var(--accent))"
          />
        ))}
        {[...Array(7)].map((_, i) => (
          <motion.circle
            key={`c3-${i}`}
             variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 0.5, transition: { delay: 1 + i * 0.1 } },
            }}
            cx={700}
            cy={100 + i * 100}
            r={10}
            fill="hsl(var(--primary))"
          />
        ))}
        {/* Lines */}
        {[...Array(7)].map((_, i) =>
          [...Array(5)].map((_, j) => (
            <motion.line
              key={`l1-${i}-${j}`}
              x1={100} y1={100 + i * 100}
              x2={400} y2={200 + j * 100}
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              variants={{
                hidden: { pathLength: 0 },
                visible: { pathLength: 1, transition: { duration: 0.5, delay: 1.5 + Math.random() * 0.5, ease: 'easeInOut' } },
              }}
            />
          ))
        )}
         {[...Array(5)].map((_, i) =>
          [...Array(7)].map((_, j) => (
            <motion.line
               key={`l2-${i}-${j}`}
              x1={400} y1={200 + i * 100}
              x2={700} y2={100 + j * 100}
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
               variants={{
                hidden: { pathLength: 0 },
                visible: { pathLength: 1, transition: { duration: 0.5, delay: 2 + Math.random() * 0.5, ease: 'easeInOut' } },
              }}
            />
          ))
        )}
      </g>
    </motion.svg>
);


export default function HeroSection() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background via-indigo-950/20 to-background animated-gradient" />
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(circle_farthest-side_at_50%_100%,hsl(var(--primary)/0.1),transparent)]" />
      <AnimatedNeuralNetwork />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center px-4"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl lg:text-7xl bg-clip-text bg-gradient-to-b from-white to-gray-400 text-glow"
        >
          Commerce360 AI
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground"
        >
          AI-Powered Retail & Delivery Intelligence for Bharat
        </motion.p>
        <motion.div
          variants={itemVariants}
          className="mt-10 flex items-center justify-center gap-x-6"
        >
          <Button asChild size="lg" className="gradient-btn">
            <Link href="/products">Explore Marketplace</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-border hover:bg-white/10">
            <Link href="/admin/dashboard">Admin Portal</Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-10"
      >
        <ArrowDown className="h-6 w-6 text-gray-400 animate-bounce" />
      </motion.div>
    </div>
  );
}
