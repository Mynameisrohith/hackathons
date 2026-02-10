"use client";

import { motion } from "framer-motion";
import { AreaChart, BarChart, FileText, ShoppingCart } from "lucide-react";
import { Card } from "../ui/card";
import Link from 'next/link';
import { Button } from "../ui/button";

const barData = [12, 19, 3, 5, 2, 3, 9, 15, 10, 8, 12, 5];
const areaData = [
  { x: 0, y: 10 }, { x: 1, y: 20 }, { x: 2, y: 15 },
  { x: 3, y: 25 }, { x: 4, y: 22 }, { x: 5, y: 30 },
  { x: 6, y: 28 },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

export default function DashboardPreview() {
  return (
    <section className="relative py-24 sm:py-32">
       <div className="text-center mb-16">
        <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-white sm:text-5xl"
        >
          Your Mission Control
        </motion.h2>
        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-4 text-lg leading-8 text-muted-foreground"
        >
          Powerful insights, beautiful interface. All in real-time.
        </motion.p>
      </div>
      <div className="relative mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
          viewport={{ once: true }}
          className="relative rounded-2xl border border-primary/20 bg-background/50 p-4 shadow-2xl shadow-primary/10 backdrop-blur-xl"
          style={{ perspective: "2000px" }}
        >
          <motion.div
            className="rounded-lg bg-background p-2 sm:p-4"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4">
              {/* Main Chart */}
              <motion.div custom={0} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative col-span-1 sm:col-span-2 rounded-lg bg-secondary/50 p-2 sm:p-4">
                <p className="mb-2 text-xs font-semibold text-white">Monthly Revenue</p>
                <div className="relative h-24 sm:h-48">
                    <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
                        <motion.path
                            d={`M0,100 L0,${100 - areaData[0].y} ` + areaData.map(p => `C${(p.x - 0.5) * 33.3},${100 - p.y} ${(p.x - 0.5) * 33.3},${100 - p.y} ${p.x * 33.3},${100 - p.y}`).join(' ') + ` L200,100 Z`}
                            fill="url(#gradient)"
                        />
                        <motion.path
                            d={"M0,100 " + areaData.map(p => `L${p.x * 33.3} ${100 - p.y}`).join(' ')}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="1.5"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            viewport={{ once: true }}
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                         <motion.circle 
                            cx={areaData[areaData.length-1].x * 33.3} 
                            cy={100 - areaData[areaData.length-1].y} 
                            r="3" 
                            fill="hsl(var(--primary))"
                            animate={{ scale: [1, 1.5, 1]}}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                    </svg>
                </div>
              </motion.div>

              {/* Side Cards */}
              <motion.div custom={1} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="col-span-1 rounded-lg bg-secondary/50 p-2 sm:p-4">
                <p className="mb-2 text-xs font-semibold text-white">Orders by Status</p>
                <div className="flex h-24 sm:h-48 items-end gap-1">
                  {barData.map((val, i) => (
                    <motion.div
                      key={i}
                      className="w-full bg-primary/20 rounded-t-sm"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${val * 6}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                      viewport={{ once: true }}
                    />
                  ))}
                </div>
              </motion.div>
              <motion.div custom={2} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="col-span-1 rounded-lg bg-secondary/50 p-2 sm:p-4">
                 <p className="mb-2 text-xs font-semibold text-white">Key Metrics</p>
                 <div className="space-y-2">
                   <MiniMetricCard icon={ShoppingCart} label="New Orders" value="1,204" />
                   <MiniMetricCard icon={FileText} label="Fraud Alerts" value="23" />
                 </div>
              </motion.div>
            </div>
          </motion.div>
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
        
         <div className="absolute inset-x-0 bottom-[-2rem] flex justify-center">
             <Button size="lg" className="gradient-btn" asChild>
                 <Link href="/admin/dashboard">See Admin Control Center</Link>
             </Button>
        </div>

      </div>
    </section>
  );
}

function MiniMetricCard({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
    return (
        <Card className="bg-background/70 p-2">
            <div className="flex items-center">
                <div className="mr-2 rounded bg-primary/10 p-1.5 text-primary">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-white">{value}</p>
                </div>
            </div>
        </Card>
    )
}
