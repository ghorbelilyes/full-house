import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/common/ui/Card.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/common/ui/Table.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
const COLORS = [
    '#6366f1',
    '#22c55e',
    '#f59e0b',
    '#f97316',
    '#8b5cf6',
    '#06b6d4',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#64748b'
];
const STATUS_COLORS = {
    paid: '#22c55e',
    pending: '#f59e0b',
    canceled: '#f97316',
    refunded: '#8b5cf6',
    unknown: '#94a3b8'
};
function fmt(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(2);
}
function fmtCurrency(n) {
    return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(n);
}
/* ── KPI Card ── */ function KpiCard({ title, value, subtitle, color = '#6366f1' }) {
    return /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardContent, {
        className: "pt-5 pb-4"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "flex items-start justify-between"
    }, /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement("p", {
        className: "text-sm font-medium text-gray-500"
    }, title), /*#__PURE__*/ React.createElement("p", {
        className: "text-2xl font-bold mt-1",
        style: {
            color
        }
    }, value), subtitle && /*#__PURE__*/ React.createElement("p", {
        className: "text-xs text-gray-400 mt-1"
    }, subtitle)))));
}
/* ── Custom Tooltip ── */ function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return /*#__PURE__*/ React.createElement("div", {
        className: "bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs"
    }, /*#__PURE__*/ React.createElement("p", {
        className: "font-semibold text-gray-700 mb-1"
    }, label), payload.map((entry, i)=>/*#__PURE__*/ React.createElement("p", {
            key: i,
            style: {
                color: entry.color
            }
        }, entry.name, ": ", typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value)));
}
/* ── Main Dashboard Analytics Component ── */ export default function DashboardAnalytics({ statsApi }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(()=>{
        fetch(statsApi, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((r)=>{
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        }).then((json)=>{
            setData(json);
            setLoading(false);
        }).catch((err)=>{
            setError(err.message);
            setLoading(false);
        });
    }, [
        statsApi
    ]);
    if (loading) {
        return /*#__PURE__*/ React.createElement("div", {
            className: "grid grid-cols-4 gap-4 mb-6"
        }, [
            1,
            2,
            3,
            4
        ].map((i)=>/*#__PURE__*/ React.createElement(Card, {
                key: i
            }, /*#__PURE__*/ React.createElement(CardContent, {
                className: "pt-5 pb-4"
            }, /*#__PURE__*/ React.createElement("div", {
                className: "animate-pulse"
            }, /*#__PURE__*/ React.createElement("div", {
                className: "h-3 bg-gray-200 rounded w-24 mb-3"
            }), /*#__PURE__*/ React.createElement("div", {
                className: "h-7 bg-gray-200 rounded w-16"
            }))))));
    }
    if (error) {
        return /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardContent, {
            className: "py-8 text-center"
        }, /*#__PURE__*/ React.createElement("p", {
            className: "text-orange-500"
        }, "Failed to load analytics: ", error)));
    }
    if (!data) return null;
    const { kpis, productPerformance, categoryRevenue, lowStock, inventoryDistribution, orderStatuses, revenueTrend, neverSold, collectionPerformance } = data;
    const topProducts = productPerformance?.slice(0, 10) || [];
    const perfChartData = (productPerformance || []).map((p)=>({
            name: p.name?.length > 18 ? p.name.substring(0, 18) + '…' : p.name,
            revenue: parseFloat(p.total_revenue) || 0,
            sold: parseInt(p.total_sold) || 0
        }));
    const catChartData = (categoryRevenue || []).map((c)=>({
            name: c.category_name,
            revenue: parseFloat(c.total_revenue) || 0,
            products: parseInt(c.product_count) || 0,
            sold: parseInt(c.total_sold) || 0
        }));
    const invChartData = (inventoryDistribution || []).map((inv)=>({
            name: inv.stock_level,
            count: parseInt(inv.product_count) || 0
        }));
    const statusChartData = (orderStatuses || []).map((s)=>({
            name: s.status || 'unknown',
            count: parseInt(s.count) || 0,
            value: parseFloat(s.total_value) || 0
        }));
    const trendData = (revenueTrend || []).map((t)=>({
            month: t.month,
            revenue: parseFloat(t.revenue) || 0,
            orders: parseInt(t.orders) || 0,
            items: parseInt(t.items_sold) || 0
        }));
    const collectionData = (collectionPerformance || []).map((c)=>({
            name: c.collection_name || c.collection_code,
            products: parseInt(c.product_count) || 0,
            sold: parseInt(c.total_sold) || 0,
            revenue: parseFloat(c.total_revenue) || 0
        }));
    return /*#__PURE__*/ React.createElement("div", {
        className: "space-y-6"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "grid grid-cols-4 gap-4"
    }, /*#__PURE__*/ React.createElement(KpiCard, {
        title: "Total Products",
        value: String(kpis.total_products || 0),
        subtitle: `${kpis.out_of_stock_count || 0} out of stock`,
        color: "#6366f1"
    }), /*#__PURE__*/ React.createElement(KpiCard, {
        title: "Total Orders",
        value: String(kpis.total_orders || 0),
        subtitle: `${kpis.orders_last_30d || 0} last 30 days`,
        color: "#22c55e"
    }), /*#__PURE__*/ React.createElement(KpiCard, {
        title: "Total Revenue",
        value: fmtCurrency(parseFloat(kpis.total_revenue) || 0),
        subtitle: `${fmtCurrency(parseFloat(kpis.revenue_last_30d) || 0)} last 30 days`,
        color: "#f59e0b"
    }), /*#__PURE__*/ React.createElement(KpiCard, {
        title: "Avg. Order Value",
        value: fmtCurrency(parseFloat(kpis.avg_order_value) || 0),
        subtitle: `${kpis.total_categories || 0} categories`,
        color: "#8b5cf6"
    })), /*#__PURE__*/ React.createElement("div", {
        className: "grid grid-cols-3 gap-5"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "col-span-2"
    }, /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardHeader, null, /*#__PURE__*/ React.createElement(CardTitle, null, "Revenue & Orders Trend"), /*#__PURE__*/ React.createElement(CardDescription, null, "Monthly performance over the last 12 months")), /*#__PURE__*/ React.createElement(CardContent, null, trendData.length === 0 ? /*#__PURE__*/ React.createElement("p", {
        className: "text-gray-400 text-sm py-8 text-center"
    }, "No order data yet") : /*#__PURE__*/ React.createElement(ResponsiveContainer, {
        width: "100%",
        height: 300
    }, /*#__PURE__*/ React.createElement(LineChart, {
        data: trendData,
        margin: {
            top: 5,
            right: 10,
            left: -10,
            bottom: 5
        }
    }, /*#__PURE__*/ React.createElement(CartesianGrid, {
        strokeDasharray: "3 3",
        stroke: "#f0f0f0"
    }), /*#__PURE__*/ React.createElement(XAxis, {
        dataKey: "month",
        tick: {
            fontSize: 11
        }
    }), /*#__PURE__*/ React.createElement(YAxis, {
        yAxisId: "left",
        tick: {
            fontSize: 11
        }
    }), /*#__PURE__*/ React.createElement(YAxis, {
        yAxisId: "right",
        orientation: "right",
        tick: {
            fontSize: 11
        }
    }), /*#__PURE__*/ React.createElement(Tooltip, {
        content: /*#__PURE__*/ React.createElement(CustomTooltip, null)
    }), /*#__PURE__*/ React.createElement(Legend, {
        wrapperStyle: {
            fontSize: 12
        }
    }), /*#__PURE__*/ React.createElement(Line, {
        yAxisId: "left",
        type: "monotone",
        dataKey: "revenue",
        stroke: "#6366f1",
        strokeWidth: 2,
        dot: {
            r: 3
        },
        name: "Revenue ($)"
    }), /*#__PURE__*/ React.createElement(Line, {
        yAxisId: "right",
        type: "monotone",
        dataKey: "orders",
        stroke: "#22c55e",
        strokeWidth: 2,
        dot: {
            r: 3
        },
        name: "Orders"
    })))))), /*#__PURE__*/ React.createElement("div", {
        className: "col-span-1"
    }, /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardHeader, null, /*#__PURE__*/ React.createElement(CardTitle, null, "Order Status"), /*#__PURE__*/ React.createElement(CardDescription, null, "Breakdown by payment status")), /*#__PURE__*/ React.createElement(CardContent, null, statusChartData.length === 0 ? /*#__PURE__*/ React.createElement("p", {
        className: "text-gray-400 text-sm py-8 text-center"
    }, "No orders yet") : /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("div", {
        style: {
            height: 180
        }
    }, /*#__PURE__*/ React.createElement(ResponsiveContainer, {
        width: "100%",
        height: "100%"
    }, /*#__PURE__*/ React.createElement(PieChart, null, /*#__PURE__*/ React.createElement(Pie, {
        data: statusChartData,
        dataKey: "count",
        nameKey: "name",
        cx: "50%",
        cy: "50%",
        innerRadius: 40,
        outerRadius: 70,
        paddingAngle: 2,
        label: ({ name, count })=>`${name} (${count})`
    }, statusChartData.map((entry, idx)=>/*#__PURE__*/ React.createElement(Cell, {
            key: idx,
            fill: STATUS_COLORS[entry.name] || COLORS[idx % COLORS.length]
        }))), /*#__PURE__*/ React.createElement(Tooltip, null)))), /*#__PURE__*/ React.createElement("div", {
        className: "mt-3 space-y-1"
    }, statusChartData.map((s, i)=>/*#__PURE__*/ React.createElement("div", {
            key: i,
            className: "flex items-center justify-between text-xs"
        }, /*#__PURE__*/ React.createElement("div", {
            className: "flex items-center gap-2"
        }, /*#__PURE__*/ React.createElement("span", {
            className: "w-2.5 h-2.5 rounded-full inline-block",
            style: {
                backgroundColor: STATUS_COLORS[s.name] || COLORS[i % COLORS.length]
            }
        }), /*#__PURE__*/ React.createElement("span", {
            className: "capitalize"
        }, s.name)), /*#__PURE__*/ React.createElement("span", {
            className: "font-medium"
        }, s.count, " orders"))))))))), /*#__PURE__*/ React.createElement("div", {
        className: "grid grid-cols-3 gap-5"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "col-span-2"
    }, /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardHeader, null, /*#__PURE__*/ React.createElement(CardTitle, null, "Product Performance"), /*#__PURE__*/ React.createElement(CardDescription, null, "Top products by revenue — identify your stars and slow movers")), /*#__PURE__*/ React.createElement(CardContent, null, perfChartData.length === 0 ? /*#__PURE__*/ React.createElement("p", {
        className: "text-gray-400 text-sm py-8 text-center"
    }, "No sales data yet") : /*#__PURE__*/ React.createElement(ResponsiveContainer, {
        width: "100%",
        height: 300
    }, /*#__PURE__*/ React.createElement(BarChart, {
        data: perfChartData.slice(0, 10),
        margin: {
            top: 5,
            right: 10,
            left: -10,
            bottom: 50
        }
    }, /*#__PURE__*/ React.createElement(CartesianGrid, {
        strokeDasharray: "3 3",
        stroke: "#f0f0f0"
    }), /*#__PURE__*/ React.createElement(XAxis, {
        dataKey: "name",
        tick: {
            fontSize: 10
        },
        angle: -35,
        textAnchor: "end",
        height: 60
    }), /*#__PURE__*/ React.createElement(YAxis, {
        yAxisId: "left",
        tick: {
            fontSize: 11
        }
    }), /*#__PURE__*/ React.createElement(YAxis, {
        yAxisId: "right",
        orientation: "right",
        tick: {
            fontSize: 11
        }
    }), /*#__PURE__*/ React.createElement(Tooltip, {
        content: /*#__PURE__*/ React.createElement(CustomTooltip, null)
    }), /*#__PURE__*/ React.createElement(Legend, {
        wrapperStyle: {
            fontSize: 12
        }
    }), /*#__PURE__*/ React.createElement(Bar, {
        yAxisId: "left",
        dataKey: "revenue",
        fill: "#6366f1",
        name: "Revenue ($)",
        radius: [
            4,
            4,
            0,
            0
        ]
    }), /*#__PURE__*/ React.createElement(Bar, {
        yAxisId: "right",
        dataKey: "sold",
        fill: "#22c55e",
        name: "Units Sold",
        radius: [
            4,
            4,
            0,
            0
        ]
    })))))), /*#__PURE__*/ React.createElement("div", {
        className: "col-span-1"
    }, /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardHeader, null, /*#__PURE__*/ React.createElement(CardTitle, null, "Revenue by Category"), /*#__PURE__*/ React.createElement(CardDescription, null, "Which categories drive the most revenue")), /*#__PURE__*/ React.createElement(CardContent, null, catChartData.length === 0 ? /*#__PURE__*/ React.createElement("p", {
        className: "text-gray-400 text-sm py-8 text-center"
    }, "No category data") : /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("div", {
        style: {
            height: 180
        }
    }, /*#__PURE__*/ React.createElement(ResponsiveContainer, {
        width: "100%",
        height: "100%"
    }, /*#__PURE__*/ React.createElement(PieChart, null, /*#__PURE__*/ React.createElement(Pie, {
        data: catChartData,
        dataKey: "revenue",
        nameKey: "name",
        cx: "50%",
        cy: "50%",
        innerRadius: 40,
        outerRadius: 70,
        paddingAngle: 2
    }, catChartData.map((_, idx)=>/*#__PURE__*/ React.createElement(Cell, {
            key: idx,
            fill: COLORS[idx % COLORS.length]
        }))), /*#__PURE__*/ React.createElement(Tooltip, {
        formatter: (value)=>fmtCurrency(value)
    })))), /*#__PURE__*/ React.createElement("div", {
        className: "mt-3 space-y-1.5"
    }, catChartData.map((c, i)=>/*#__PURE__*/ React.createElement("div", {
            key: i,
            className: "flex items-center justify-between text-xs"
        }, /*#__PURE__*/ React.createElement("div", {
            className: "flex items-center gap-2"
        }, /*#__PURE__*/ React.createElement("span", {
            className: "w-2.5 h-2.5 rounded-full inline-block",
            style: {
                backgroundColor: COLORS[i % COLORS.length]
            }
        }), /*#__PURE__*/ React.createElement("span", null, c.name)), /*#__PURE__*/ React.createElement("span", {
            className: "font-medium"
        }, fmtCurrency(c.revenue)))))))))), /*#__PURE__*/ React.createElement("div", {
        className: "grid grid-cols-3 gap-5"
    }, /*#__PURE__*/ React.createElement("div", {
        className: "col-span-1"
    }, /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardHeader, null, /*#__PURE__*/ React.createElement(CardTitle, null, "Inventory Health"), /*#__PURE__*/ React.createElement(CardDescription, null, "Stock level distribution across products")), /*#__PURE__*/ React.createElement(CardContent, null, invChartData.length === 0 ? /*#__PURE__*/ React.createElement("p", {
        className: "text-gray-400 text-sm py-8 text-center"
    }, "No inventory data") : /*#__PURE__*/ React.createElement(ResponsiveContainer, {
        width: "100%",
        height: 220
    }, /*#__PURE__*/ React.createElement(BarChart, {
        data: invChartData,
        layout: "vertical",
        margin: {
            top: 5,
            right: 10,
            left: 5,
            bottom: 5
        }
    }, /*#__PURE__*/ React.createElement(CartesianGrid, {
        strokeDasharray: "3 3",
        stroke: "#f0f0f0"
    }), /*#__PURE__*/ React.createElement(XAxis, {
        type: "number",
        tick: {
            fontSize: 11
        }
    }), /*#__PURE__*/ React.createElement(YAxis, {
        dataKey: "name",
        type: "category",
        tick: {
            fontSize: 10
        },
        width: 90
    }), /*#__PURE__*/ React.createElement(Tooltip, {
        content: /*#__PURE__*/ React.createElement(CustomTooltip, null)
    }), /*#__PURE__*/ React.createElement(Bar, {
        dataKey: "count",
        name: "Products",
        radius: [
            0,
            4,
            4,
            0
        ]
    }, invChartData.map((_, idx)=>{
        const stockColors = [
            '#f97316',
            '#f97316',
            '#f59e0b',
            '#22c55e',
            '#06b6d4'
        ];
        return /*#__PURE__*/ React.createElement(Cell, {
            key: idx,
            fill: stockColors[idx] || COLORS[idx]
        });
    }))))))), /*#__PURE__*/ React.createElement("div", {
        className: "col-span-2"
    }, /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardHeader, null, /*#__PURE__*/ React.createElement(CardTitle, null, "Collection Performance"), /*#__PURE__*/ React.createElement(CardDescription, null, "Featured collections — how well are your curated collections performing?")), /*#__PURE__*/ React.createElement(CardContent, null, collectionData.length === 0 ? /*#__PURE__*/ React.createElement("p", {
        className: "text-gray-400 text-sm py-8 text-center"
    }, "No collections yet") : /*#__PURE__*/ React.createElement(Table, null, /*#__PURE__*/ React.createElement(TableHeader, null, /*#__PURE__*/ React.createElement(TableRow, null, /*#__PURE__*/ React.createElement(TableHead, null, "Collection"), /*#__PURE__*/ React.createElement(TableHead, null, "Products"), /*#__PURE__*/ React.createElement(TableHead, null, "Units Sold"), /*#__PURE__*/ React.createElement(TableHead, null, "Revenue"), /*#__PURE__*/ React.createElement(TableHead, null, "Avg / Product"))), /*#__PURE__*/ React.createElement(TableBody, null, collectionData.map((c, i)=>/*#__PURE__*/ React.createElement(TableRow, {
            key: i
        }, /*#__PURE__*/ React.createElement(TableCell, null, /*#__PURE__*/ React.createElement("div", {
            className: "flex items-center gap-2"
        }, /*#__PURE__*/ React.createElement("span", {
            className: "w-2 h-2 rounded-full",
            style: {
                backgroundColor: COLORS[i % COLORS.length]
            }
        }), /*#__PURE__*/ React.createElement("span", {
            className: "font-medium"
        }, c.name))), /*#__PURE__*/ React.createElement(TableCell, null, c.products), /*#__PURE__*/ React.createElement(TableCell, null, c.sold), /*#__PURE__*/ React.createElement(TableCell, {
            className: "font-medium"
        }, fmtCurrency(c.revenue)), /*#__PURE__*/ React.createElement(TableCell, null, c.products > 0 ? fmtCurrency(c.revenue / c.products) : '—'))))))))), /*#__PURE__*/ React.createElement("div", {
        className: "grid grid-cols-2 gap-5"
    }, /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardHeader, null, /*#__PURE__*/ React.createElement(CardTitle, null, "⚠️ Low Stock Alerts"), /*#__PURE__*/ React.createElement(CardDescription, null, "Products with 5 or fewer units remaining")), /*#__PURE__*/ React.createElement(CardContent, null, (lowStock || []).length === 0 ? /*#__PURE__*/ React.createElement("p", {
        className: "text-green-600 text-sm py-4 text-center"
    }, "✓ All products are well stocked") : /*#__PURE__*/ React.createElement(Table, null, /*#__PURE__*/ React.createElement(TableHeader, null, /*#__PURE__*/ React.createElement(TableRow, null, /*#__PURE__*/ React.createElement(TableHead, null, "Product"), /*#__PURE__*/ React.createElement(TableHead, null, "SKU"), /*#__PURE__*/ React.createElement(TableHead, null, "Stock"), /*#__PURE__*/ React.createElement(TableHead, null, "Price"))), /*#__PURE__*/ React.createElement(TableBody, null, lowStock.map((p, i)=>/*#__PURE__*/ React.createElement(TableRow, {
            key: i
        }, /*#__PURE__*/ React.createElement(TableCell, {
            className: "font-medium max-w-[200px] truncate"
        }, p.name), /*#__PURE__*/ React.createElement(TableCell, {
            className: "text-gray-500 text-xs"
        }, p.sku), /*#__PURE__*/ React.createElement(TableCell, null, /*#__PURE__*/ React.createElement("span", {
            className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.stock_qty === 0 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`
        }, p.stock_qty, " left")), /*#__PURE__*/ React.createElement(TableCell, null, fmtCurrency(parseFloat(p.price))))))))), /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardHeader, null, /*#__PURE__*/ React.createElement(CardTitle, null, "🐢 Never Sold Products"), /*#__PURE__*/ React.createElement(CardDescription, null, "Products that have never been purchased — consider promotions or removal")), /*#__PURE__*/ React.createElement(CardContent, null, (neverSold || []).length === 0 ? /*#__PURE__*/ React.createElement("p", {
        className: "text-green-600 text-sm py-4 text-center"
    }, "✓ All products have at least one sale") : /*#__PURE__*/ React.createElement(Table, null, /*#__PURE__*/ React.createElement(TableHeader, null, /*#__PURE__*/ React.createElement(TableRow, null, /*#__PURE__*/ React.createElement(TableHead, null, "Product"), /*#__PURE__*/ React.createElement(TableHead, null, "SKU"), /*#__PURE__*/ React.createElement(TableHead, null, "Price"), /*#__PURE__*/ React.createElement(TableHead, null, "Listed Since"))), /*#__PURE__*/ React.createElement(TableBody, null, neverSold.map((p, i)=>/*#__PURE__*/ React.createElement(TableRow, {
            key: i
        }, /*#__PURE__*/ React.createElement(TableCell, {
            className: "font-medium max-w-[200px] truncate"
        }, p.name), /*#__PURE__*/ React.createElement(TableCell, {
            className: "text-gray-500 text-xs"
        }, p.sku), /*#__PURE__*/ React.createElement(TableCell, null, fmtCurrency(parseFloat(p.price))), /*#__PURE__*/ React.createElement(TableCell, {
            className: "text-xs text-gray-500"
        }, p.created_at ? new Date(p.created_at).toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : '—')))))))), /*#__PURE__*/ React.createElement(Card, null, /*#__PURE__*/ React.createElement(CardHeader, null, /*#__PURE__*/ React.createElement(CardTitle, null, "🏆 Top Products Detailed"), /*#__PURE__*/ React.createElement(CardDescription, null, "Complete view of your best-performing products with stock, revenue, and orders")), /*#__PURE__*/ React.createElement(CardContent, null, topProducts.length === 0 ? /*#__PURE__*/ React.createElement("p", {
        className: "text-gray-400 text-sm py-4 text-center"
    }, "No sales data yet") : /*#__PURE__*/ React.createElement(Table, null, /*#__PURE__*/ React.createElement(TableHeader, null, /*#__PURE__*/ React.createElement(TableRow, null, /*#__PURE__*/ React.createElement(TableHead, null, "#"), /*#__PURE__*/ React.createElement(TableHead, null, "Product"), /*#__PURE__*/ React.createElement(TableHead, null, "SKU"), /*#__PURE__*/ React.createElement(TableHead, null, "Price"), /*#__PURE__*/ React.createElement(TableHead, null, "Stock"), /*#__PURE__*/ React.createElement(TableHead, null, "Sold"), /*#__PURE__*/ React.createElement(TableHead, null, "Orders"), /*#__PURE__*/ React.createElement(TableHead, null, "Revenue"))), /*#__PURE__*/ React.createElement(TableBody, null, topProducts.map((p, i)=>/*#__PURE__*/ React.createElement(TableRow, {
            key: i
        }, /*#__PURE__*/ React.createElement(TableCell, null, /*#__PURE__*/ React.createElement("span", {
            className: "text-xs font-bold text-gray-400"
        }, i + 1)), /*#__PURE__*/ React.createElement(TableCell, {
            className: "font-medium max-w-[250px] truncate"
        }, p.name), /*#__PURE__*/ React.createElement(TableCell, {
            className: "text-gray-500 text-xs"
        }, p.sku), /*#__PURE__*/ React.createElement(TableCell, null, fmtCurrency(parseFloat(p.price))), /*#__PURE__*/ React.createElement(TableCell, null, /*#__PURE__*/ React.createElement("span", {
            className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${(p.stock_qty || 0) === 0 ? 'bg-orange-100 text-orange-800' : (p.stock_qty || 0) <= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`
        }, p.stock_qty ?? '—')), /*#__PURE__*/ React.createElement(TableCell, {
            className: "font-medium"
        }, p.total_sold), /*#__PURE__*/ React.createElement(TableCell, null, p.order_count), /*#__PURE__*/ React.createElement(TableCell, {
            className: "font-bold text-indigo-600"
        }, fmtCurrency(parseFloat(p.total_revenue))))))))));
}
export const layout = {
    areaId: 'content',
    sortOrder: 5
};
export const query = `
  query Query {
    statsApi: url(routeId: "dashboardStats")
  }
`;
