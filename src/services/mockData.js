// src/services/mockData.js
import { subDays, format, addDays } from 'date-fns';

const today = new Date();

export const mockRevenueData = Array.from({ length: 7 }).map((_, i) => ({
  name: format(subDays(today, 6 - i), 'EEE'),
  revenue: Math.floor(Math.random() * 5000) + 2000,
  expenses: Math.floor(Math.random() * 2000) + 500,
}));

export const mockOccupancyData = Array.from({ length: 7 }).map((_, i) => ({
  name: format(subDays(today, 6 - i), 'EEE'),
  rate: Math.floor(Math.random() * 40) + 50, // 50% to 90%
}));

export const mockRecentBookings = [
  {
    id: 'RES-1029',
    guest: 'Eleanor Shellstrop',
    room: 'Ocean View Suite - 402',
    checkIn: format(today, 'MMM dd, yyyy'),
    checkOut: format(addDays(today, 3), 'MMM dd, yyyy'),
    status: 'booked',
    amount: 1250,
  },
  {
    id: 'RES-1028',
    guest: 'Chidi Anagonye',
    room: 'Standard Double - 204',
    checkIn: format(subDays(today, 1), 'MMM dd, yyyy'),
    checkOut: format(addDays(today, 2), 'MMM dd, yyyy'),
    status: 'occupied',
    amount: 450,
  },
  {
    id: 'RES-1027',
    guest: 'Tahani Al-Jamil',
    room: 'Presidential Suite - 501',
    checkIn: format(addDays(today, 2), 'MMM dd, yyyy'),
    checkOut: format(addDays(today, 7), 'MMM dd, yyyy'),
    status: 'pending',
    amount: 4500,
  },
  {
    id: 'RES-1026',
    guest: 'Jason Mendoza',
    room: 'Standard Single - 105',
    checkIn: format(subDays(today, 2), 'MMM dd, yyyy'),
    checkOut: format(today, 'MMM dd, yyyy'),
    status: 'completed',
    amount: 280,
  },
];

export const mockDashboardStats = {
  totalRevenue: 45230,
  revenueTrend: 12.5,
  occupancyRate: 78,
  occupancyTrend: 4.2,
  totalRooms: 120,
  checkInsToday: 14,
  checkOutsToday: 8,
  openMaintenanceTasks: 3,
  pendingPaymentsTotal: 5400,
  pendingPaymentsCount: 6,
  monthlyPayrollCost: 24500,
  staffOnShift: 18,
};

export const mockStaffTasks = [
  { id: 'TSK-001', room: '105', type: 'cleaning', priority: 'high', status: 'pending', time: '10:00 AM' },
  { id: 'TSK-002', room: '204', type: 'maintenance', priority: 'medium', status: 'in-progress', time: '11:30 AM' },
  { id: 'TSK-003', room: '501', type: 'guest-request', priority: 'high', status: 'pending', time: '12:15 PM' },
  { id: 'TSK-004', room: '308', type: 'cleaning', priority: 'low', status: 'completed', time: '09:00 AM' },
];

export const mockAccountantStats = {
  totalRevenue: 125430,
  totalExpenses: 42100,
  netProfit: 83330,
  pendingInvoices: 12,
  payrollTotal: 24500,
  taxLiability: 15400,
};

export const mockExpenseBreakdown = [
  { name: 'Payroll', value: 24500 },
  { name: 'Utilities', value: 8200 },
  { name: 'Maintenance', value: 5400 },
  { name: 'Marketing', value: 4000 },
];

export const mockCustomerStays = {
  points: 4500,
  tier: 'Gold',
  upcoming: [
    {
      id: 'RES-1035',
      hotel: 'LuxStay Downtown',
      room: 'Deluxe King',
      checkIn: format(addDays(today, 14), 'MMM dd, yyyy'),
      checkOut: format(addDays(today, 18), 'MMM dd, yyyy'),
      status: 'booked'
    }
  ],
  past: [
    {
      id: 'RES-0942',
      hotel: 'LuxStay Resort',
      room: 'Ocean View Suite',
      checkIn: format(subDays(today, 45), 'MMM dd, yyyy'),
      checkOut: format(subDays(today, 40), 'MMM dd, yyyy'),
      status: 'completed'
    }
  ]
};
