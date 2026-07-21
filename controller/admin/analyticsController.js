import { getAnalyticsStatsService } from "../../services/admin/analyticsService.js";

const VALID_PERIODS = ["day", "week", "year", "all"];

export const showAnalytics = async (req, res) => {
  const period = VALID_PERIODS.includes(req.query.period)
    ? req.query.period
    : "all";
  try {
    const stats = await getAnalyticsStatsService(period);

    return res.render("Admin/analytics.ejs", {
      period: stats.period,
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      totalCustomers: stats.totalCustomers,
      avgValuePerOrder: stats.avgValuePerOrder,
      conversionRate: stats.conversionRate,
      categoryPerformance: stats.categoryPerformance,
      topProducts: stats.topProducts,
      revenueTrend: stats.revenueTrend,
    });
  } catch (error) {
    console.error("Error loading analytics stats:", error);
    return res.render("Admin/analytics.ejs", {
      period,
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      avgValuePerOrder: 0,
      conversionRate: 0,
      categoryPerformance: [],
      topProducts: [],
      revenueTrend: { labels: [], values: [] },
    });
  }
};
