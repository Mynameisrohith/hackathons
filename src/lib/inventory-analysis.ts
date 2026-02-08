
import type { Order, Product, ProductAnalysis, MarketAnalysis } from '@/lib/types';
import { sub, differenceInDays } from 'date-fns';

export function analyzeInventory(products: Product[], orders: Order[]) {
    const now = new Date();
    const thirtyDaysAgo = sub(now, { days: 30 });
    const fourteenDaysAgo = sub(now, { days: 14 });
    const sevenDaysAgo = sub(now, { days: 7 });

    const productSales: { [key: string]: { total: number; last7: number; prev7: number; last30: number } } = {};

    for (const product of products) {
        productSales[product.id] = { total: 0, last7: 0, prev7: 0, last30: 0 };
    }

    for (const order of orders) {
        const orderDate = order.createdAt.toDate();
        for (const item of order.items) {
            if (productSales[item.productId]) {
                productSales[item.productId].total += item.quantity;
                if (orderDate > thirtyDaysAgo) {
                    productSales[item.productId].last30 += item.quantity;
                }
                if (orderDate > fourteenDaysAgo) {
                    if (orderDate > sevenDaysAgo) {
                        productSales[item.productId].last7 += item.quantity;
                    } else {
                        productSales[item.productId].prev7 += item.quantity;
                    }
                }
            }
        }
    }
    
    const analyzedProducts: ProductAnalysis[] = products.map(product => {
        const sales = productSales[product.id];
        const salesVelocity = sales.last30 / 30; // Average daily sales over last 30 days
        const daysUntilStockout = salesVelocity > 0 ? product.stock / salesVelocity : Infinity;
        
        let riskLevel: ProductAnalysis['riskLevel'] = 'N/A';
        if (salesVelocity > 0) {
            if (daysUntilStockout < 7) riskLevel = 'High';
            else if (daysUntilStockout < 30) riskLevel = 'Medium';
            else riskLevel = 'Low';
        }

        const isOverstocked = daysUntilStockout > 180 && sales.last30 < 5;

        let suggestedRestock = product.stock;
        if (riskLevel === 'High' || riskLevel === 'Medium') {
            suggestedRestock = Math.ceil(salesVelocity * 30); // Suggest 30 days of stock
        }
        
        const momentumScore = sales.prev7 > 0
            ? (sales.last7 - sales.prev7) / sales.prev7
            : sales.last7 > 0 ? 1 : 0;
            
        let trend: ProductAnalysis['trendInfo']['trend'] = 'Stable';
        if(momentumScore > 0.2) trend = 'Rising';
        if(momentumScore < -0.2) trend = 'Declining';

        return {
            ...product,
            salesVelocity,
            daysUntilStockout,
            riskLevel,
            isOverstocked,
            suggestedRestock,
            trendInfo: { momentumScore, trend }
        };
    });

    const totalSalesLast7 = orders
        .filter(o => o.createdAt.toDate() > sevenDaysAgo && o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);
    
    const totalSalesPrev7 = orders
        .filter(o => {
            const date = o.createdAt.toDate();
            return date > fourteenDaysAgo && date <= sevenDaysAgo && o.orderStatus !== 'Cancelled';
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);

    const weeklyGrowth = totalSalesPrev7 > 0 ? (totalSalesLast7 - totalSalesPrev7) / totalSalesPrev7 : (totalSalesLast7 > 0 ? 1 : 0);
    
    // Simplified volatility score
    const salesValues = analyzedProducts.map(p => productSales[p.id].last30);
    const avgSales = salesValues.reduce((a, b) => a + b, 0) / salesValues.length;
    const stdDev = Math.sqrt(salesValues.map(x => Math.pow(x - avgSales, 2)).reduce((a, b) => a + b, 0) / salesValues.length);
    const cv = avgSales > 0 ? stdDev / avgSales : 0; // Coefficient of Variation

    let volatility: MarketAnalysis['volatility'] = 'Stable';
    let businessImpactLabel = "Market is predictable.";
    if (cv > 1.5) {
        volatility = 'Volatile';
        businessImpactLabel = "High uncertainty in product demand.";
    }
    else if (cv > 0.7) {
        volatility = 'Moderate';
        businessImpactLabel = "Some fluctuations in sales exist.";
    }

    const marketAnalysis: MarketAnalysis = {
        weeklyGrowth,
        volatility,
        volatilityScore: cv,
        businessImpactLabel,
    };

    return {
        marketAnalysis,
        analyzedProducts,
        risingProducts: analyzedProducts.filter(p => p.trendInfo.trend === 'Rising').sort((a,b) => b.trendInfo.momentumScore - a.trendInfo.momentumScore),
        decliningProducts: analyzedProducts.filter(p => p.trendInfo.trend === 'Declining').sort((a,b) => a.trendInfo.momentumScore - b.trendInfo.momentumScore),
        atRiskProducts: analyzedProducts.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Medium').sort((a,b) => a.daysUntilStockout - b.daysUntilStockout),
        restockSuggestions: analyzedProducts.filter(p => p.suggestedRestock > p.stock && (p.riskLevel === 'High' || p.riskLevel === 'Medium')).sort((a,b) => a.daysUntilStockout - b.daysUntilStockout),
        overstockedProducts: analyzedProducts.filter(p => p.isOverstocked).sort((a,b) => b.daysUntilStockout - a.daysUntilStockout),
    };
}
