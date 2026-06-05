import apiClient from './api';
// Removed mockData import
import { format, isValid } from 'date-fns';

const safeFormat = (dateStr, fmt = 'MMM dd, yyyy') => {
  try {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, fmt) : 'N/A';
  } catch {
    return 'N/A';
  }
};

export const dashboardService = {
  // ─── Admin ────────────────────────────────────────────────────────────────
  getAdminStats: async () => {
    const response = await apiClient.get('/dashboards');
    const dbData = response.data;

    return {
      stats: {
        checkInsToday: dbData.todayCheckIns || 0,
        checkOutsToday: dbData.todayCheckOuts || 0,
        occupancyRate: dbData.occupancyRate || 0,
        pendingReservations: dbData.pendingReservations || 0,
        openMaintenanceTasks: dbData.openMaintenance?.length || 0,
        roomStatus: dbData.roomStatus || {},
      },
      revenueChart: (dbData.revenueByMonth || []).slice().reverse().map(item => ({ name: item._id, value: item.revenue, revenue: item.revenue, expenses: 0 })),
      occupancyChart: [],
      recentBookings: (dbData.upcomingReservations || []).map((res) => ({
        id: res.reservationNumber || res._id,
        guest: res.customerId
          ? `${res.customerId.firstName || ''} ${res.customerId.lastName || ''}`.trim() || 'Unknown Guest'
          : 'Unknown Guest',
        room: res.roomId?.roomNumber ? `Room ${res.roomId.roomNumber}` : 'Unassigned',
        checkIn: safeFormat(res.checkInDate),
        checkOut: safeFormat(res.checkOutDate),
        status: res.status?.toLowerCase() || 'pending',
        amount: res.totalPrice || 0,
      })),
    };
  },

  // ─── Staff ────────────────────────────────────────────────────────────────
  getStaffStats: async () => {
    const response = await apiClient.get('/dashboards');
    const dbData = response.data;

    const mappedTasks = (dbData.assignedMaintenanceDetails || []).map((task) => ({
      id: task._id,
      room: task.roomId?.roomNumber || 'Unknown',
      type: 'maintenance',
      priority: task.priority?.toLowerCase() || 'medium',
      status:
        task.status === 'OPEN'
          ? 'pending'
          : task.status === 'IN_PROGRESS'
            ? 'in-progress'
            : 'completed',
      time: safeFormat(task.createdAt, 'hh:mm a'),
      description: task.description || '',
    }));

    return {
      tasks: mappedTasks,
      stats: {
        assigned: dbData.assignedMaintenanceTasks || 0,
        completedToday: 0,
        pending: mappedTasks.filter((t) => t.status !== 'completed').length,
      },
      todayCheckIns: dbData.todayCheckIns || 0,
      todayCheckInsDetails: dbData.todayCheckInsDetails || [],
      todayCheckOuts: dbData.todayCheckOuts || 0,
      todayCheckOutsDetails: dbData.todayCheckOutsDetails || [],
    };
  },

  // ─── Accountant ───────────────────────────────────────────────────────────
  getAccountantStats: async () => {
    const response = await apiClient.get('/dashboards');
    const dbData = response.data;

    // paymentSummary is an array like [{_id: 'PAID', count, total}, ...]
    const paidEntry = (dbData.paymentSummary || []).find((s) => s._id === 'PAID');
    const pendingEntry = (dbData.paymentSummary || []).find((s) => s._id === 'PENDING');

    const totalRevenue = paidEntry?.total || 0;
    const totalExpenses = dbData.payrollSummary?.totalNetSalary || 0;

    // Build chart data from monthlyRevenue — backend returns newest-first, reverse for chart
    const mappedRevenue = (dbData.monthlyRevenue || [])
      .slice()
      .reverse()
      .map((item) => ({
        name: item._id, // e.g. "2026-05"
        revenue: item.revenue || 0,
        expenses: 0,
      }));

    // Map pending payments for the table
    const pendingPayments = (dbData.pendingPayments || []).map((p) => ({
      id: p._id,
      paymentNumber: p.paymentNumber,
      amount: p.amount,
      currency: p.currency || 'ETB',
      customerName: p.customerName || 'Unknown',
      customerEmail: p.customerEmail || '',
      status: p.status,
      reservation: p.reservation?.reservationNumber || 'N/A',
      createdAt: safeFormat(p.createdAt),
    }));

    return {
      stats: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingInvoices: pendingEntry?.count || 0,
        todayRevenue: dbData.todayRevenue || 0,
      },
      revenueChart: mappedRevenue,
      expenseBreakdown: [
        { name: 'Payroll', value: dbData.payrollSummary?.totalNetSalary || 0 },
        { name: 'Maintenance', value: 0 },
        { name: 'Other', value: 0 },
      ],
      pendingPayments,
      payrollSummary: dbData.payrollSummary || {},
    };
  },

  // ─── Customer ─────────────────────────────────────────────────────────────
  getCustomerStats: async () => {
    const response = await apiClient.get('/dashboards');
    const dbData = response.data;

    // Determine loyalty tier by total reservations
    const totalRes = dbData.totalReservations || 0;
    const tier = totalRes >= 10 ? 'Platinum' : totalRes >= 5 ? 'Gold' : totalRes >= 2 ? 'Silver' : 'Member';
    const points = (dbData.totalPayments || 0) * 10;

    return {
      stays: {
        points,
        tier,
        upcoming: (dbData.upcomingReservations || []).map((res) => ({
          id: res._id,
          hotel: 'LuxStay Resort',
          room: res.roomId?.type
            ? `${res.roomId.type} - Room ${res.roomId.roomNumber || ''}`
            : res.roomId?.roomNumber
              ? `Room ${res.roomId.roomNumber}`
              : 'Assigned on arrival',
          checkIn: safeFormat(res.checkInDate),
          checkOut: safeFormat(res.checkOutDate),
          status: res.status?.toLowerCase() || 'pending',
          totalPrice: res.totalPrice || 0,
        })),
        past: (dbData.recentReservations || []).map((res) => ({
          id: res._id,
          guest: 'Me',
          room: res.roomId?.roomNumber ? `Room ${res.roomId.roomNumber}` : 'Unknown',
          checkIn: safeFormat(res.checkInDate),
          checkOut: safeFormat(res.checkOutDate),
          status: res.status?.toLowerCase() || 'completed',
          amount: res.totalPrice || 0, // FIX: was totalAmount, schema uses totalPrice
        })),
      },
      totalReservations: dbData.totalReservations || 0,
      totalPayments: dbData.totalPayments || 0,
      paymentSummary: dbData.paymentSummary || [],
    };
  },

  // ─── Advanced analytics (SUPER_ADMIN / ADMIN only) ────────────────────────
  getAdvancedAnalytics: async (startDate, endDate) => {
    let url = '/dashboards/analytics';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },
};