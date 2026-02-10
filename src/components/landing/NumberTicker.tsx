
"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface NumberTickerProps {
  value: number;
  className?: string;
}

export default function NumberTicker({
  value,
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString("en-US"));

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 1.5,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, value, count]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
