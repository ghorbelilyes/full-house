import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@components/common/ui/Table.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';

const COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#64748b'
];

const STATUS_COLORS: Record<string, string> = {
  paid: '#22c55e',
  pending: '#f59e0b',
  canceled: '#ef4444',
  refunded: '#8b5cf6',
  unknown: '#94a3b8'
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
}

/* ── KPI Card ── */
function KpiCard({
  title,
  value,
  subtitle,
  color = '#6366f1'
}: {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

/* ── Main Dashboard Analytics Component ── */
export default function DashboardAnalytics({ statsApi }: { statsApi: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(statsApi, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
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
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4">
              <div className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
                <div className="h-7 bg-gray-200 rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-500">Failed to load analytics: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const {
    kpis,
    productPerformance,
    categoryRevenue,
    lowStock,
    inventoryDistribution,
    orderStatuses,
    revenueTrend,
    neverSold,
    collectionPerformance
  } = data;

  const topProducts = productPerformance?.slice(0, 10) || [];
  const perfChartData = (productPerformance || []).map((p: any) => ({
    name: p.name?.length > 18 ? p.name.substring(0, 18) + '…' : p.name,
    revenue: parseFloat(p.total_revenue) || 0,
    sold: parseInt(p.total_sold) || 0
  }));

  const catChartData = (categoryRevenue || []).map((c: any) => ({
    name: c.category_name,
    revenue: parseFloat(c.total_revenue) || 0,
    products: parseInt(c.product_count) || 0,
    sold: parseInt(c.total_sold) || 0
  }));

  const invChartData = (inventoryDistribution || []).map((inv: any) => ({
    name: inv.stock_level,
    count: parseInt(inv.product_count) || 0
  }));

  const statusChartData = (orderStatuses || []).map((s: any) => ({
    name: s.status || 'unknown',
    count: parseInt(s.count) || 0,
    value: parseFloat(s.total_value) || 0
  }));

  const trendData = (revenueTrend || []).map((t: any) => ({
    month: t.month,
    revenue: parseFloat(t.revenue) || 0,
    orders: parseInt(t.orders) || 0,
    items: parseInt(t.items_sold) || 0
  }));

  const collectionData = (collectionPerformance || []).map((c: any) => ({
    name: c.collection_name || c.collection_code,
    products: parseInt(c.product_count) || 0,
    sold: parseInt(c.total_sold) || 0,
    revenue: parseFloat(c.total_revenue) || 0
  }));

  return (
    <div className="space-y-6">
      {/* ── KPI Row ── */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          title="Total Products"
          value={String(kpis.total_products || 0)}
          subtitle={`${kpis.out_of_stock_count || 0} out of stock`}
          color="#6366f1"
        />
        <KpiCard
          title="Total Orders"
          value={String(kpis.total_orders || 0)}
          subtitle={`${kpis.orders_last_30d || 0} last 30 days`}
          color="#22c55e"
        />
        <KpiCard
          title="Total Revenue"
          value={fmtCurrency(parseFloat(kpis.total_revenue) || 0)}
          subtitle={`${fmtCurrency(parseFloat(kpis.revenue_last_30d) || 0)} last 30 days`}
          color="#f59e0b"
        />
        <KpiCard
          title="Avg. Order Value"
          value={fmtCurrency(parseFloat(kpis.avg_order_value) || 0)}
          subtitle={`${kpis.total_categories || 0} categories`}
          color="#8b5cf6"
        />
      </div>

      {/* ── Row 2: Revenue Trend + Order Status ── */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Orders Trend</CardTitle>
              <CardDescription>Monthly performance over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No order data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Revenue ($)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Breakdown by payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {statusChartData.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No orders yet</p>
              ) : (
                <>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          label={({ name, count }) => `${name} (${count})`}
                        >
                          {statusChartData.map((entry: any, idx: number) => (
                            <Cell
                              key={idx}
                              fill={STATUS_COLORS[entry.name] || COLORS[idx % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-1">
                    {statusChartData.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: STATUS_COLORS[s.name] || COLORS[i % COLORS.length] }}
                          />
                          <span className="capitalize">{s.name}</span>
                        </div>
                        <span className="font-medium">{s.count} orders</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Row 3: Product Performance + Category Revenue ── */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Top products by revenue — identify your stars and slow movers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {perfChartData.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No sales data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={perfChartData.slice(0, 10)}
                    margin={{ top: 5, right: 10, left: -10, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-35}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="revenue" fill="#6366f1" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="sold" fill="#22c55e" name="Units Sold" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>Which categories drive the most revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {catChartData.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No category data</p>
              ) : (
                <>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={catChartData}
                          dataKey="revenue"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {catChartData.map((_: any, idx: number) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => fmtCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {catChartData.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span>{c.name}</span>
                        </div>
                        <span className="font-medium">{fmtCurrency(c.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Row 4: Inventory Distribution + Collection Performance ── */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Health</CardTitle>
              <CardDescription>Stock level distribution across products</CardDescription>
            </CardHeader>
            <CardContent>
              {invChartData.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No inventory data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={invChartData} layout="vertical" margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Products" radius={[0, 4, 4, 0]}>
                      {invChartData.map((_: any, idx: number) => {
                        const stockColors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#06b6d4'];
                        return <Cell key={idx} fill={stockColors[idx] || COLORS[idx]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Collection Performance</CardTitle>
              <CardDescription>
                Featured collections — how well are your curated collections performing?
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collectionData.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">No collections yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Units Sold</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Avg / Product</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectionData.map((c: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{c.products}</TableCell>
                        <TableCell>{c.sold}</TableCell>
                        <TableCell className="font-medium">{fmtCurrency(c.revenue)}</TableCell>
                        <TableCell>
                          {c.products > 0 ? fmtCurrency(c.revenue / c.products) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Row 5: Low Stock + Never Sold ── */}
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Low Stock Alerts</CardTitle>
            <CardDescription>Products with 5 or fewer units remaining</CardDescription>
          </CardHeader>
          <CardContent>
            {(lowStock || []).length === 0 ? (
              <p className="text-green-600 text-sm py-4 text-center">
                ✓ All products are well stocked
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((p: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">{p.sku}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.stock_qty === 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {p.stock_qty} left
                        </span>
                      </TableCell>
                      <TableCell>{fmtCurrency(parseFloat(p.price))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🐢 Never Sold Products</CardTitle>
            <CardDescription>
              Products that have never been purchased — consider promotions or removal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(neverSold || []).length === 0 ? (
              <p className="text-green-600 text-sm py-4 text-center">
                ✓ All products have at least one sale
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Listed Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neverSold.map((p: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">{p.sku}</TableCell>
                      <TableCell>{fmtCurrency(parseFloat(p.price))}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 6: Top 10 Product Details Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Products Detailed</CardTitle>
          <CardDescription>
            Complete view of your best-performing products with stock, revenue, and orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No sales data yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>
                      <span className="text-xs font-bold text-gray-400">
                        {i + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      {p.name}
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">{p.sku}</TableCell>
                    <TableCell>{fmtCurrency(parseFloat(p.price))}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          (p.stock_qty || 0) === 0
                            ? 'bg-red-100 text-red-800'
                            : (p.stock_qty || 0) <= 5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {p.stock_qty ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{p.total_sold}</TableCell>
                    <TableCell>{p.order_count}</TableCell>
                    <TableCell className="font-bold text-indigo-600">
                      {fmtCurrency(parseFloat(p.total_revenue))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
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
