import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/common/ui/Card.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/common/ui/Table.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
const COLORS = [
    '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#64748b'
];
const STATUS_COLORS = {
    paid: '#22c55e',
    pending: '#f59e0b',
    canceled: '#ef4444',
    refunded: '#8b5cf6',
    unknown: '#94a3b8'
};
function fmt(n) {
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${(n / 1000).toFixed(1)}K`;
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
/* ── KPI Card ── */
function KpiCard({ title, value, subtitle, color = '#6366f1' }) {
    return (React.createElement(Card, null,
        React.createElement(CardContent, { className: "pt-5 pb-4" },
            React.createElement("div", { className: "flex items-start justify-between" },
                React.createElement("div", null,
                    React.createElement("p", { className: "text-sm font-medium text-gray-500" }, title),
                    React.createElement("p", { className: "text-2xl font-bold mt-1", style: { color } }, value),
                    subtitle && (React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, subtitle)))))));
}
/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !(payload === null || payload === void 0 ? void 0 : payload.length))
        return null;
    return (React.createElement("div", { className: "bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs" },
        React.createElement("p", { className: "font-semibold text-gray-700 mb-1" }, label),
        payload.map((entry, i) => (React.createElement("p", { key: i, style: { color: entry.color } },
            entry.name,
            ": ",
            typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value)))));
}
/* ── Main Dashboard Analytics Component ── */
export default function DashboardAnalytics({ statsApi }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetch(statsApi, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
            .then((r) => {
            if (!r.ok)
                throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
            .then((json) => {
            setData(json);
            setLoading(false);
        })
            .catch((err) => {
            setError(err.message);
            setLoading(false);
        });
    }, [statsApi]);
    if (loading) {
        return (React.createElement("div", { className: "grid grid-cols-4 gap-4 mb-6" }, [1, 2, 3, 4].map((i) => (React.createElement(Card, { key: i },
            React.createElement(CardContent, { className: "pt-5 pb-4" },
                React.createElement("div", { className: "animate-pulse" },
                    React.createElement("div", { className: "h-3 bg-gray-200 rounded w-24 mb-3" }),
                    React.createElement("div", { className: "h-7 bg-gray-200 rounded w-16" }))))))));
    }
    if (error) {
        return (React.createElement(Card, null,
            React.createElement(CardContent, { className: "py-8 text-center" },
                React.createElement("p", { className: "text-red-500" },
                    "Failed to load analytics: ",
                    error))));
    }
    if (!data)
        return null;
    const { kpis, productPerformance, categoryRevenue, lowStock, inventoryDistribution, orderStatuses, revenueTrend, neverSold, collectionPerformance } = data;
    const topProducts = (productPerformance === null || productPerformance === void 0 ? void 0 : productPerformance.slice(0, 10)) || [];
    const perfChartData = (productPerformance || []).map((p) => {
        var _a;
        return ({
            name: ((_a = p.name) === null || _a === void 0 ? void 0 : _a.length) > 18 ? p.name.substring(0, 18) + '…' : p.name,
            revenue: parseFloat(p.total_revenue) || 0,
            sold: parseInt(p.total_sold) || 0
        });
    });
    const catChartData = (categoryRevenue || []).map((c) => ({
        name: c.category_name,
        revenue: parseFloat(c.total_revenue) || 0,
        products: parseInt(c.product_count) || 0,
        sold: parseInt(c.total_sold) || 0
    }));
    const invChartData = (inventoryDistribution || []).map((inv) => ({
        name: inv.stock_level,
        count: parseInt(inv.product_count) || 0
    }));
    const statusChartData = (orderStatuses || []).map((s) => ({
        name: s.status || 'unknown',
        count: parseInt(s.count) || 0,
        value: parseFloat(s.total_value) || 0
    }));
    const trendData = (revenueTrend || []).map((t) => ({
        month: t.month,
        revenue: parseFloat(t.revenue) || 0,
        orders: parseInt(t.orders) || 0,
        items: parseInt(t.items_sold) || 0
    }));
    const collectionData = (collectionPerformance || []).map((c) => ({
        name: c.collection_name || c.collection_code,
        products: parseInt(c.product_count) || 0,
        sold: parseInt(c.total_sold) || 0,
        revenue: parseFloat(c.total_revenue) || 0
    }));
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "grid grid-cols-4 gap-4" },
            React.createElement(KpiCard, { title: "Total Products", value: String(kpis.total_products || 0), subtitle: `${kpis.out_of_stock_count || 0} out of stock`, color: "#6366f1" }),
            React.createElement(KpiCard, { title: "Total Orders", value: String(kpis.total_orders || 0), subtitle: `${kpis.orders_last_30d || 0} last 30 days`, color: "#22c55e" }),
            React.createElement(KpiCard, { title: "Total Revenue", value: fmtCurrency(parseFloat(kpis.total_revenue) || 0), subtitle: `${fmtCurrency(parseFloat(kpis.revenue_last_30d) || 0)} last 30 days`, color: "#f59e0b" }),
            React.createElement(KpiCard, { title: "Avg. Order Value", value: fmtCurrency(parseFloat(kpis.avg_order_value) || 0), subtitle: `${kpis.total_categories || 0} categories`, color: "#8b5cf6" })),
        React.createElement("div", { className: "grid grid-cols-3 gap-5" },
            React.createElement("div", { className: "col-span-2" },
                React.createElement(Card, null,
                    React.createElement(CardHeader, null,
                        React.createElement(CardTitle, null, "Revenue & Orders Trend"),
                        React.createElement(CardDescription, null, "Monthly performance over the last 12 months")),
                    React.createElement(CardContent, null, trendData.length === 0 ? (React.createElement("p", { className: "text-gray-400 text-sm py-8 text-center" }, "No order data yet")) : (React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
                        React.createElement(LineChart, { data: trendData, margin: { top: 5, right: 10, left: -10, bottom: 5 } },
                            React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }),
                            React.createElement(XAxis, { dataKey: "month", tick: { fontSize: 11 } }),
                            React.createElement(YAxis, { yAxisId: "left", tick: { fontSize: 11 } }),
                            React.createElement(YAxis, { yAxisId: "right", orientation: "right", tick: { fontSize: 11 } }),
                            React.createElement(Tooltip, { content: React.createElement(CustomTooltip, null) }),
                            React.createElement(Legend, { wrapperStyle: { fontSize: 12 } }),
                            React.createElement(Line, { yAxisId: "left", type: "monotone", dataKey: "revenue", stroke: "#6366f1", strokeWidth: 2, dot: { r: 3 }, name: "Revenue ($)" }),
                            React.createElement(Line, { yAxisId: "right", type: "monotone", dataKey: "orders", stroke: "#22c55e", strokeWidth: 2, dot: { r: 3 }, name: "Orders" }))))))),
            React.createElement("div", { className: "col-span-1" },
                React.createElement(Card, null,
                    React.createElement(CardHeader, null,
                        React.createElement(CardTitle, null, "Order Status"),
                        React.createElement(CardDescription, null, "Breakdown by payment status")),
                    React.createElement(CardContent, null, statusChartData.length === 0 ? (React.createElement("p", { className: "text-gray-400 text-sm py-8 text-center" }, "No orders yet")) : (React.createElement(React.Fragment, null,
                        React.createElement("div", { style: { height: 180 } },
                            React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                                React.createElement(PieChart, null,
                                    React.createElement(Pie, { data: statusChartData, dataKey: "count", nameKey: "name", cx: "50%", cy: "50%", innerRadius: 40, outerRadius: 70, paddingAngle: 2, label: ({ name, count }) => `${name} (${count})` }, statusChartData.map((entry, idx) => (React.createElement(Cell, { key: idx, fill: STATUS_COLORS[entry.name] || COLORS[idx % COLORS.length] })))),
                                    React.createElement(Tooltip, null)))),
                        React.createElement("div", { className: "mt-3 space-y-1" }, statusChartData.map((s, i) => (React.createElement("div", { key: i, className: "flex items-center justify-between text-xs" },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("span", { className: "w-2.5 h-2.5 rounded-full inline-block", style: { backgroundColor: STATUS_COLORS[s.name] || COLORS[i % COLORS.length] } }),
                                React.createElement("span", { className: "capitalize" }, s.name)),
                            React.createElement("span", { className: "font-medium" },
                                s.count,
                                " orders"))))))))))),
        React.createElement("div", { className: "grid grid-cols-3 gap-5" },
            React.createElement("div", { className: "col-span-2" },
                React.createElement(Card, null,
                    React.createElement(CardHeader, null,
                        React.createElement(CardTitle, null, "Product Performance"),
                        React.createElement(CardDescription, null, "Top products by revenue \u2014 identify your stars and slow movers")),
                    React.createElement(CardContent, null, perfChartData.length === 0 ? (React.createElement("p", { className: "text-gray-400 text-sm py-8 text-center" }, "No sales data yet")) : (React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
                        React.createElement(BarChart, { data: perfChartData.slice(0, 10), margin: { top: 5, right: 10, left: -10, bottom: 50 } },
                            React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }),
                            React.createElement(XAxis, { dataKey: "name", tick: { fontSize: 10 }, angle: -35, textAnchor: "end", height: 60 }),
                            React.createElement(YAxis, { yAxisId: "left", tick: { fontSize: 11 } }),
                            React.createElement(YAxis, { yAxisId: "right", orientation: "right", tick: { fontSize: 11 } }),
                            React.createElement(Tooltip, { content: React.createElement(CustomTooltip, null) }),
                            React.createElement(Legend, { wrapperStyle: { fontSize: 12 } }),
                            React.createElement(Bar, { yAxisId: "left", dataKey: "revenue", fill: "#6366f1", name: "Revenue ($)", radius: [4, 4, 0, 0] }),
                            React.createElement(Bar, { yAxisId: "right", dataKey: "sold", fill: "#22c55e", name: "Units Sold", radius: [4, 4, 0, 0] }))))))),
            React.createElement("div", { className: "col-span-1" },
                React.createElement(Card, null,
                    React.createElement(CardHeader, null,
                        React.createElement(CardTitle, null, "Revenue by Category"),
                        React.createElement(CardDescription, null, "Which categories drive the most revenue")),
                    React.createElement(CardContent, null, catChartData.length === 0 ? (React.createElement("p", { className: "text-gray-400 text-sm py-8 text-center" }, "No category data")) : (React.createElement(React.Fragment, null,
                        React.createElement("div", { style: { height: 180 } },
                            React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
                                React.createElement(PieChart, null,
                                    React.createElement(Pie, { data: catChartData, dataKey: "revenue", nameKey: "name", cx: "50%", cy: "50%", innerRadius: 40, outerRadius: 70, paddingAngle: 2 }, catChartData.map((_, idx) => (React.createElement(Cell, { key: idx, fill: COLORS[idx % COLORS.length] })))),
                                    React.createElement(Tooltip, { formatter: (value) => fmtCurrency(value) })))),
                        React.createElement("div", { className: "mt-3 space-y-1.5" }, catChartData.map((c, i) => (React.createElement("div", { key: i, className: "flex items-center justify-between text-xs" },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("span", { className: "w-2.5 h-2.5 rounded-full inline-block", style: { backgroundColor: COLORS[i % COLORS.length] } }),
                                React.createElement("span", null, c.name)),
                            React.createElement("span", { className: "font-medium" }, fmtCurrency(c.revenue)))))))))))),
        React.createElement("div", { className: "grid grid-cols-3 gap-5" },
            React.createElement("div", { className: "col-span-1" },
                React.createElement(Card, null,
                    React.createElement(CardHeader, null,
                        React.createElement(CardTitle, null, "Inventory Health"),
                        React.createElement(CardDescription, null, "Stock level distribution across products")),
                    React.createElement(CardContent, null, invChartData.length === 0 ? (React.createElement("p", { className: "text-gray-400 text-sm py-8 text-center" }, "No inventory data")) : (React.createElement(ResponsiveContainer, { width: "100%", height: 220 },
                        React.createElement(BarChart, { data: invChartData, layout: "vertical", margin: { top: 5, right: 10, left: 5, bottom: 5 } },
                            React.createElement(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }),
                            React.createElement(XAxis, { type: "number", tick: { fontSize: 11 } }),
                            React.createElement(YAxis, { dataKey: "name", type: "category", tick: { fontSize: 10 }, width: 90 }),
                            React.createElement(Tooltip, { content: React.createElement(CustomTooltip, null) }),
                            React.createElement(Bar, { dataKey: "count", name: "Products", radius: [0, 4, 4, 0] }, invChartData.map((_, idx) => {
                                const stockColors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#06b6d4'];
                                return React.createElement(Cell, { key: idx, fill: stockColors[idx] || COLORS[idx] });
                            })))))))),
            React.createElement("div", { className: "col-span-2" },
                React.createElement(Card, null,
                    React.createElement(CardHeader, null,
                        React.createElement(CardTitle, null, "Collection Performance"),
                        React.createElement(CardDescription, null, "Featured collections \u2014 how well are your curated collections performing?")),
                    React.createElement(CardContent, null, collectionData.length === 0 ? (React.createElement("p", { className: "text-gray-400 text-sm py-8 text-center" }, "No collections yet")) : (React.createElement(Table, null,
                        React.createElement(TableHeader, null,
                            React.createElement(TableRow, null,
                                React.createElement(TableHead, null, "Collection"),
                                React.createElement(TableHead, null, "Products"),
                                React.createElement(TableHead, null, "Units Sold"),
                                React.createElement(TableHead, null, "Revenue"),
                                React.createElement(TableHead, null, "Avg / Product"))),
                        React.createElement(TableBody, null, collectionData.map((c, i) => (React.createElement(TableRow, { key: i },
                            React.createElement(TableCell, null,
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: COLORS[i % COLORS.length] } }),
                                    React.createElement("span", { className: "font-medium" }, c.name))),
                            React.createElement(TableCell, null, c.products),
                            React.createElement(TableCell, null, c.sold),
                            React.createElement(TableCell, { className: "font-medium" }, fmtCurrency(c.revenue)),
                            React.createElement(TableCell, null, c.products > 0 ? fmtCurrency(c.revenue / c.products) : '—'))))))))))),
        React.createElement("div", { className: "grid grid-cols-2 gap-5" },
            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "\u26A0\uFE0F Low Stock Alerts"),
                    React.createElement(CardDescription, null, "Products with 5 or fewer units remaining")),
                React.createElement(CardContent, null, (lowStock || []).length === 0 ? (React.createElement("p", { className: "text-green-600 text-sm py-4 text-center" }, "\u2713 All products are well stocked")) : (React.createElement(Table, null,
                    React.createElement(TableHeader, null,
                        React.createElement(TableRow, null,
                            React.createElement(TableHead, null, "Product"),
                            React.createElement(TableHead, null, "SKU"),
                            React.createElement(TableHead, null, "Stock"),
                            React.createElement(TableHead, null, "Price"))),
                    React.createElement(TableBody, null, lowStock.map((p, i) => (React.createElement(TableRow, { key: i },
                        React.createElement(TableCell, { className: "font-medium max-w-[200px] truncate" }, p.name),
                        React.createElement(TableCell, { className: "text-gray-500 text-xs" }, p.sku),
                        React.createElement(TableCell, null,
                            React.createElement("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.stock_qty === 0
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'}` },
                                p.stock_qty,
                                " left")),
                        React.createElement(TableCell, null, fmtCurrency(parseFloat(p.price))))))))))),
            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "\uD83D\uDC22 Never Sold Products"),
                    React.createElement(CardDescription, null, "Products that have never been purchased \u2014 consider promotions or removal")),
                React.createElement(CardContent, null, (neverSold || []).length === 0 ? (React.createElement("p", { className: "text-green-600 text-sm py-4 text-center" }, "\u2713 All products have at least one sale")) : (React.createElement(Table, null,
                    React.createElement(TableHeader, null,
                        React.createElement(TableRow, null,
                            React.createElement(TableHead, null, "Product"),
                            React.createElement(TableHead, null, "SKU"),
                            React.createElement(TableHead, null, "Price"),
                            React.createElement(TableHead, null, "Listed Since"))),
                    React.createElement(TableBody, null, neverSold.map((p, i) => (React.createElement(TableRow, { key: i },
                        React.createElement(TableCell, { className: "font-medium max-w-[200px] truncate" }, p.name),
                        React.createElement(TableCell, { className: "text-gray-500 text-xs" }, p.sku),
                        React.createElement(TableCell, null, fmtCurrency(parseFloat(p.price))),
                        React.createElement(TableCell, { className: "text-xs text-gray-500" }, p.created_at
                            ? new Date(p.created_at).toLocaleDateString('en', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })
                            : '—')))))))))),
        React.createElement(Card, null,
            React.createElement(CardHeader, null,
                React.createElement(CardTitle, null, "\uD83C\uDFC6 Top Products Detailed"),
                React.createElement(CardDescription, null, "Complete view of your best-performing products with stock, revenue, and orders")),
            React.createElement(CardContent, null, topProducts.length === 0 ? (React.createElement("p", { className: "text-gray-400 text-sm py-4 text-center" }, "No sales data yet")) : (React.createElement(Table, null,
                React.createElement(TableHeader, null,
                    React.createElement(TableRow, null,
                        React.createElement(TableHead, null, "#"),
                        React.createElement(TableHead, null, "Product"),
                        React.createElement(TableHead, null, "SKU"),
                        React.createElement(TableHead, null, "Price"),
                        React.createElement(TableHead, null, "Stock"),
                        React.createElement(TableHead, null, "Sold"),
                        React.createElement(TableHead, null, "Orders"),
                        React.createElement(TableHead, null, "Revenue"))),
                React.createElement(TableBody, null, topProducts.map((p, i) => {
                    var _a;
                    return (React.createElement(TableRow, { key: i },
                        React.createElement(TableCell, null,
                            React.createElement("span", { className: "text-xs font-bold text-gray-400" }, i + 1)),
                        React.createElement(TableCell, { className: "font-medium max-w-[250px] truncate" }, p.name),
                        React.createElement(TableCell, { className: "text-gray-500 text-xs" }, p.sku),
                        React.createElement(TableCell, null, fmtCurrency(parseFloat(p.price))),
                        React.createElement(TableCell, null,
                            React.createElement("span", { className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${(p.stock_qty || 0) === 0
                                    ? 'bg-red-100 text-red-800'
                                    : (p.stock_qty || 0) <= 5
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'}` }, (_a = p.stock_qty) !== null && _a !== void 0 ? _a : '—')),
                        React.createElement(TableCell, { className: "font-medium" }, p.total_sold),
                        React.createElement(TableCell, null, p.order_count),
                        React.createElement(TableCell, { className: "font-bold text-indigo-600" }, fmtCurrency(parseFloat(p.total_revenue)))));
                }))))))));
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
//# sourceMappingURL=DashboardAnalytics.js.map