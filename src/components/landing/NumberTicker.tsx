
"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { useSpring, animated } from "@react-spring/web";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  className?: string;
}

export default function NumberTicker({
  value,
  direction = "up",
  className,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { number } = useSpring({
    from: { number: 0 },
    to: { number: isInView ? value : 0 },
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 },
  });

  return (
    <animated.span ref={ref} className={className}>
      {number.to((n) => n.toLocaleString("en-US", { maximumFractionDigits: 0 }))}
    </animated.span>
  );
}
