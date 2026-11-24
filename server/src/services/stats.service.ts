import pool from "../db.js";

interface Totals {
  users: number;
  active_users: number;
  courses: number;
  active_courses: number;
  categories: number;
  enrollments: number;
  succeeded_payments: number;
  revenue: string;
  revenue_this_month: string;
}

export async function getDashboardStats() {
  const [totalsResult, rolesResult] = await Promise.all([
    pool.query<Totals>(
      `SELECT
          (SELECT COUNT(*)::int FROM users) AS users,
          (SELECT COUNT(*)::int FROM users WHERE status) AS active_users,
          (SELECT COUNT(*)::int FROM courses) AS courses,
          (SELECT COUNT(*)::int FROM courses WHERE status) AS active_courses,
          (SELECT COUNT(*)::int FROM categories) AS categories,
          (SELECT COUNT(*)::int FROM user_courses) AS enrollments,
          (SELECT COUNT(*)::int FROM payments WHERE status = 'succeeded') AS succeeded_payments,
          (SELECT COALESCE(SUM(amount), 0) FROM payments
            WHERE status = 'succeeded') AS revenue,
          (SELECT COALESCE(SUM(amount), 0) FROM payments
            WHERE status = 'succeeded'
              AND paid_at >= date_trunc('month', now())) AS revenue_this_month`,
    ),
    pool.query<{ role: string; count: number }>(
      `SELECT r.title AS role, COUNT(u.id)::int AS count
        FROM roles r
        LEFT JOIN users u ON u.role_id = r.id
        GROUP BY r.title`,
    ),
  ]);

  const totals = totalsResult.rows[0];
  if (!totals) throw new Error("The stats query returned no row");

  const usersByRole: Record<string, number> = {};
  for (const row of rolesResult.rows) usersByRole[row.role] = row.count;

  return {
    users: {
      total: totals.users,
      active: totals.active_users,
      by_role: usersByRole,
    },
    courses: { total: totals.courses, active: totals.active_courses },
    categories: totals.categories,
    enrollments: totals.enrollments,
    payments: {
      succeeded: totals.succeeded_payments,
      revenue: totals.revenue,
      revenue_this_month: totals.revenue_this_month,
    },
  };
}
