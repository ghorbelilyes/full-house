import { pool } from '@evershop/evershop/lib/postgres';
async function q(sql) {
    const client = await pool.connect();
    try {
        const result = await client.query(sql);
        return result.rows;
    }
    catch (err) {
        console.error('SQL ERROR:', err.message, '\nQuery:', sql.substring(0, 100));
        return null;
    }
    finally {
        client.release();
    }
}
export default async function dashboardStats(request, response) {
    try {
        // 1. Product Performance
        const productPerformance = await q(`
      SELECT
        p.product_id, pd.name, p.sku, p.price,
        pi2.qty AS stock_qty, pi2.stock_availability,
        COALESCE(sales.total_sold, 0) AS total_sold,
        COALESCE(sales.total_revenue, 0) AS total_revenue,
        COALESCE(sales.order_count, 0) AS order_count
      FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      LEFT JOIN product_inventory pi2 ON pi2.product_inventory_product_id = p.product_id
      LEFT JOIN (
        SELECT product_id,
          SUM(qty) AS total_sold,
          SUM(line_total_with_discount) AS total_revenue,
          COUNT(DISTINCT order_item_order_id) AS order_count
        FROM order_item GROUP BY product_id
      ) sales ON sales.product_id = p.product_id
      WHERE p.status = true
      ORDER BY total_revenue DESC
      LIMIT 20
    `);
        // 2. Category Revenue
        const categoryRevenue = await q(`
      SELECT
        cd.name AS category_name,
        COUNT(DISTINCT p.product_id) AS product_count,
        COALESCE(SUM(sales.total_revenue), 0) AS total_revenue,
        COALESCE(SUM(sales.total_sold), 0) AS total_sold
      FROM category c
      JOIN category_description cd ON cd.category_description_category_id = c.category_id
      JOIN product p ON p.category_id = c.category_id AND p.status = true
      LEFT JOIN (
        SELECT product_id, SUM(line_total_with_discount) AS total_revenue, SUM(qty) AS total_sold
        FROM order_item GROUP BY product_id
      ) sales ON sales.product_id = p.product_id
      GROUP BY c.category_id, cd.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);
        // 3. Low Stock Alerts
        const lowStock = await q(`
      SELECT p.product_id, pd.name, p.sku, p.price,
        pi2.qty AS stock_qty, pi2.stock_availability
      FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi2 ON pi2.product_inventory_product_id = p.product_id
      WHERE pi2.manage_stock = true AND pi2.qty <= 5 AND p.status = true
      ORDER BY pi2.qty ASC
      LIMIT 15
    `);
        // 4. Inventory Distribution
        const inventoryDistribution = await q(`
      SELECT stock_level, COUNT(*) AS product_count
      FROM (
        SELECT CASE
          WHEN pi2.qty = 0 THEN 'Out of Stock'
          WHEN pi2.qty BETWEEN 1 AND 5 THEN 'Critical (1-5)'
          WHEN pi2.qty BETWEEN 6 AND 20 THEN 'Low (6-20)'
          WHEN pi2.qty BETWEEN 21 AND 50 THEN 'Medium (21-50)'
          ELSE 'High (50+)'
        END AS stock_level
        FROM product p
        JOIN product_inventory pi2 ON pi2.product_inventory_product_id = p.product_id
        WHERE p.status = true
      ) sub
      GROUP BY stock_level
      ORDER BY CASE stock_level
        WHEN 'Out of Stock' THEN 1 WHEN 'Critical (1-5)' THEN 2
        WHEN 'Low (6-20)' THEN 3 WHEN 'Medium (21-50)' THEN 4 ELSE 5
      END
    `);
        // 5. Order Status
        const orderStatuses = await q(`
      SELECT COALESCE(payment_status, 'unknown') AS status,
        COUNT(*) AS count,
        COALESCE(SUM(grand_total), 0) AS total_value
      FROM "order"
      GROUP BY payment_status
      ORDER BY count DESC
    `);
        // 6. Revenue Trend (12 months)
        const revenueTrend = await q(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
        COUNT(*) AS orders,
        COALESCE(SUM(grand_total), 0) AS revenue,
        COALESCE(SUM(total_qty), 0) AS items_sold
      FROM "order"
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `);
        // 7. KPIs
        const kpis = await q(`
      SELECT
        (SELECT COUNT(*) FROM product WHERE status = true) AS total_products,
        (SELECT COUNT(*) FROM "order") AS total_orders,
        (SELECT COALESCE(SUM(grand_total), 0) FROM "order") AS total_revenue,
        (SELECT COALESCE(AVG(grand_total), 0) FROM "order") AS avg_order_value,
        (SELECT COUNT(*) FROM product p2
         JOIN product_inventory pi3 ON pi3.product_inventory_product_id = p2.product_id
         WHERE p2.status = true AND pi3.qty = 0 AND pi3.manage_stock = true
        ) AS out_of_stock_count,
        (SELECT COUNT(*) FROM category) AS total_categories,
        (SELECT COUNT(*) FROM "order" WHERE created_at >= NOW() - INTERVAL '30 days') AS orders_last_30d,
        (SELECT COALESCE(SUM(grand_total), 0) FROM "order" WHERE created_at >= NOW() - INTERVAL '30 days') AS revenue_last_30d
    `);
        // 8. Never-sold products
        const neverSold = await q(`
      SELECT p.product_id, pd.name, p.sku, p.price,
        pi2.qty AS stock_qty, p.created_at
      FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      LEFT JOIN product_inventory pi2 ON pi2.product_inventory_product_id = p.product_id
      LEFT JOIN order_item oi ON oi.product_id = p.product_id
      WHERE p.status = true AND oi.order_item_id IS NULL
      ORDER BY p.created_at ASC
      LIMIT 10
    `);
        // 9. Collection performance
        const collectionPerformance = await q(`
      SELECT col.code AS collection_code, col.name AS collection_name,
        COUNT(DISTINCT pc2.product_id) AS product_count,
        COALESCE(SUM(sales.total_sold), 0) AS total_sold,
        COALESCE(SUM(sales.total_revenue), 0) AS total_revenue
      FROM collection col
      JOIN product_collection pc2 ON pc2.collection_id = col.collection_id
      JOIN product p ON p.product_id = pc2.product_id AND p.status = true
      LEFT JOIN (
        SELECT product_id, SUM(qty) AS total_sold, SUM(line_total_with_discount) AS total_revenue
        FROM order_item GROUP BY product_id
      ) sales ON sales.product_id = p.product_id
      GROUP BY col.collection_id, col.code, col.name
      ORDER BY total_revenue DESC
    `);
        response.json({
            kpis: (kpis && kpis[0]) || {},
            productPerformance: productPerformance || [],
            categoryRevenue: categoryRevenue || [],
            lowStock: lowStock || [],
            inventoryDistribution: inventoryDistribution || [],
            orderStatuses: orderStatuses || [],
            revenueTrend: revenueTrend || [],
            neverSold: neverSold || [],
            collectionPerformance: collectionPerformance || []
        });
    }
    catch (err) {
        response.status(500).json({ error: { message: err.message } });
    }
}
//# sourceMappingURL=dashboardStats.js.map