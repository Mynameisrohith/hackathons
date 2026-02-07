
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, Pie, PieChart, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
};

const statusColors = {
  Pending: "hsl(var(--chart-1))",
  Packed: "hsl(var(--chart-2))",
  'Out for Delivery': "hsl(var(--chart-3))",
  Delivered: "hsl(var(--chart-4))",
  Cancelled: "hsl(var(--chart-5))",
}

export function RevenueChart({ data }: { data: number[] }) {
    const chartData = [
        { month: "Jan", revenue: data[0] }, { month: "Feb", revenue: data[1] },
        { month: "Mar", revenue: data[2] }, { month: "Apr", revenue: data[3] },
        { month: "May", revenue: data[4] }, { month: "Jun", revenue: data[5] },
        { month: "Jul", revenue: data[6] }, { month: "Aug", revenue: data[7] },
        { month: "Sep", revenue: data[8] }, { month: "Oct", revenue: data[9] },
        { month: "Nov", revenue: data[10] }, { month: "Dec", revenue: data[11] },
    ]
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
        </LineChart>
    </ChartContainer>
  );
}

export function OrderStatusChart({ data }: { data: { name: string, value: number }[] }) {
    const chartConfig = data.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: statusColors[item.name as keyof typeof statusColors] };
        return acc;
    }, {} as any);

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-square">
        <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
             <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name as keyof typeof statusColors]} />
                ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
    </ChartContainer>
  );
}

export function CategoryDistributionChart({ data }: { data: { name: string, value: number }[] }) {
    const chartConfig = data.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: `hsl(var(--chart-${Object.keys(acc).length + 1}))` };
        return acc;
    }, {} as any);
  return (
     <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-square">
        <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
             <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8">
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartConfig[entry.name].color} />
                ))}
            </Pie>
        </PieChart>
    </ChartContainer>
  );
}

export function SalesByCityChart({ data }: { data: {[key: string]: number } }) {
    const chartData = Object.entries(data).map(([city, revenue]) => ({ city, revenue }));
    return (
        <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--chart-1))" } }} className="min-h-[200px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                 <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="city" type="category" tickLine={false} axisLine={false} tickMargin={8} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
        </ChartContainer>
    )
}
