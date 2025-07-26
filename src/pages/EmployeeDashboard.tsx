import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Settings,
  ClipboardList,
  Menu as MenuIcon,
  LogOut,
  ChevronDown,
  UserCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Search,
  Package,
  Clock,
  TrendingUp,
  Timer,
  Volume2,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

import { supabase } from '../lib/supabase';
import { Calendar } from '../components/ui/calendar';
import NotificationBell from '../components/NotificationBell';
import NewOrderAlert from '../components/NewOrderAlert';
import MenuManagement from '../components/MenuManagement';
import { useUser } from '../hooks/useUser';
import OrdersTable from "@/components/OrdersTable";
import LanguageSelector from '../components/LanguageSelector';

// --- Types ---
interface OrderItem {
  item_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  hole_number: number;
  ordered_items: OrderItem[];
  notes: string;
  created_at: string;
  fulfillment_status: 'new' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
  customer_name: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface MetricData {
  value: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface DashboardMetrics {
  revenue: MetricData;
  orders: MetricData;
  customers: MetricData;
  avgOrderValue: MetricData;
}

const tabs: TabConfig[] = [
  { id: 'home', label: 'home', icon: Home },
  { id: 'orders', label: 'orders', icon: ClipboardList },
  { id: 'menu', label: 'menu', icon: MenuIcon, adminOnly: true },
  { id: 'settings', label: 'settings', icon: Settings },
];

const VIEW_MODES = ['Day', 'Week', 'Month'] as const;
type ViewMode = typeof VIEW_MODES[number];

export default function EmployeeDashboard() {
  const { user, role, isAdmin, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // --- State ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [holeFilter, setHoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [session, setSession] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('Day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    revenue: { value: 0, previousValue: 0, change: 0, trend: 'neutral' },
    orders: { value: 0, previousValue: 0, change: 0, trend: 'neutral' },
    customers: { value: 0, previousValue: 0, change: 0, trend: 'neutral' },
    avgOrderValue: { value: 0, previousValue: 0, change: 0, trend: 'neutral' },
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

    // --- Effect: Auth and Real-time Orders ---
  useEffect(() => {
    if (userLoading) return;
    if (!user || (role !== 'employee' && role !== 'admin')) {
      navigate('/login',{ replace: true});
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const channel = supabase
      .channel('custom-all-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const insertedOrder = payload.new as Order;
        setOrders(curr => [insertedOrder, ...curr]);
        setNotificationCount(count => count + 1);
        if (showOverlay) setPendingOrders(current => [...current, insertedOrder]);
        else {
          setNewOrder(insertedOrder);
          setShowOverlay(true);
        }
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [navigate, showOverlay, user, role, userLoading]);

  const handleOverlayDismiss = () => {
    if (pendingOrders.length > 0) {
      const [nextOrder, ...remainingOrders] = pendingOrders;
      setNewOrder(nextOrder);
      setPendingOrders(remainingOrders);
    } else {
      setShowOverlay(false);
      setNewOrder(null);
    }
  };

  const handleNotificationClick = () => {
    setActiveTab('orders');
    setStatusFilter('new-group');
  };
  
  function handleEditOrder(orderId: string) {
    alert("Editing order: " + orderId);
    // Or setEditingOrderId(orderId), open modal, etc.
  }

  // --- Orders Fetch ---
  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from<Order>('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter === 'new-group') query = query.in('fulfillment_status', ['new', 'preparing', 'on_the_way']);
      else if (statusFilter === 'completed') query = query.eq('fulfillment_status', 'delivered');
      else if (statusFilter === 'cancelled') query = query.eq('fulfillment_status', 'cancelled');
      if (holeFilter !== 'all') query = query.eq('hole_number', Number(holeFilter));
      if (search) query = query.ilike('ordered_items', `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchOrders(); }, [statusFilter, holeFilter, search]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setError(null);
    try {
      const { error } = await supabase.from('orders').update({ fulfillment_status: newStatus }).eq('id', orderId).select();
      if (error) {
        setError('Failed to update order status. Please try again.');
        return;
      }
      await fetchOrders();
    } catch (err) { setError('An unexpected error occurred. Please try again.'); }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) intervalId = setInterval(() => { fetchMetrics(); }, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [autoRefresh]);

  // --- Metrics Helpers ---
  const getDateRange = () => {
    const now = selectedDate;
    switch (viewMode) {
      case 'Day': return { start: startOfDay(now), end: endOfDay(now), previous: { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) } };
      case 'Week': return { start: startOfWeek(now), end: endOfWeek(now), previous: { start: startOfWeek(subDays(now, 7)), end: endOfWeek(subDays(now, 7)) } };
      case 'Month': return { start: startOfMonth(now), end: endOfMonth(now), previous: { start: startOfMonth(subDays(now, 30)), end: endOfMonth(subDays(now, 30)) } };
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    const dateRange = getDateRange();
    try {
      const { data: currentOrders } = await supabase.from('orders').select('*').gte('created_at', dateRange.start.toISOString()).lte('created_at', dateRange.end.toISOString());
      const { data: previousOrders } = await supabase.from('orders').select('*').gte('created_at', dateRange.previous.start.toISOString()).lte('created_at', dateRange.previous.end.toISOString());
      const calculateMetrics = (orders: Order[]) => {
        const revenue = orders.reduce((sum, order) => sum + order.ordered_items.reduce((total, item) => total + (item.price * item.quantity), 0), 0);
        const uniqueCustomers = new Set(orders.map(o => o.customer_name)).size;
        const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;
        return { revenue, orders: orders.length, customers: uniqueCustomers, avgOrderValue };
      };
      const current = calculateMetrics(currentOrders || []);
      const previous = calculateMetrics(previousOrders || []);
      setMetrics({
        revenue: {
          value: current.revenue, previousValue: previous.revenue,
          change: previous.revenue ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
          trend: current.revenue >= previous.revenue ? 'up' : 'down'
        },
        orders: {
          value: current.orders, previousValue: previous.orders,
          change: previous.orders ? ((current.orders - previous.orders) / previous.orders) * 100 : 0,
          trend: current.orders >= previous.orders ? 'up' : 'down'
        },
        customers: {
          value: current.customers, previousValue: previous.customers,
          change: previous.customers ? ((current.customers - previous.customers) / previous.customers) * 100 : 0,
          trend: current.customers >= previous.customers ? 'up' : 'down'
        },
        avgOrderValue: {
          value: current.avgOrderValue, previousValue: previous.avgOrderValue,
          change: previous.avgOrderValue ? ((current.avgOrderValue - previous.avgOrderValue) / previous.avgOrderValue) * 100 : 0,
          trend: current.avgOrderValue >= previous.avgOrderValue ? 'up' : 'down'
        }
      });
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMetrics(); }, [viewMode, selectedDate]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    const days = viewMode === 'Day' ? 1 : viewMode === 'Week' ? 7 : 30;
    setSelectedDate(current =>
      direction === 'prev'
        ? subDays(current, days)
        : new Date(current.getTime() + (days * 24 * 60 * 60 * 1000))
    );
  };

  const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/login', { replace: true }); // Go to login page!
  } catch (error) {
    // handle error
  }
};

  const exportData = () => {
    const data = {
      metrics,
      exportDate: new Date().toISOString(),
      viewMode,
      dateRange: getDateRange(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-${format(selectedDate, 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

    // --- KPI Toolbar (Sticky under Green Header) ---
const renderToolbar = () => (
  <div className="w-full flex items-center justify-between px-4 py-2 bg-white">
    {/* Left: View modes and date controls */}
    <div className="flex items-center gap-2">
      {VIEW_MODES.map(mode => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors focus:ring-2 focus:ring-green-400 ${
            viewMode === mode ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t(mode.toLowerCase())}
        </button>
      ))}
      <button
        onClick={() => handleDateChange('prev')}
        className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-green-400 min-w-[36px] flex items-center justify-center"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-gray-600 text-sm px-2">
        {format(selectedDate, 'dd MMM yyyy')}
      </span>
      <button
        onClick={() => handleDateChange('next')}
        className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-green-400 min-w-[36px] flex items-center justify-center"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-green-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <CalendarIcon className="w-5 h-5" />
      </button>
     {showCalendar && (
  <>
    {/* Overlay to close calendar on click */}
    <div
      className="fixed inset-0 z-40 bg-black/10"
      onClick={() => setShowCalendar(false)}
      aria-label="Close calendar"
    />
    {/* Popover calendar panel */}
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl p-1"
      style={{
        top: '84px', // adjust this for your actual header+toolbar height
        left: 'calc(50% - 125px)', // adjust for alignment, or use right-8 for right side
        minWidth: '250',
        maxWidth: '280px'
      }}
    >
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={date => {
          setSelectedDate(date || new Date());
          setShowCalendar(false);
        }}
        initialFocus
      />
    </div>
  </>
)}

    </div>
    {/* Right: Auto-refresh & Download */}
    <div className="flex items-center gap-2">
      <button
        onClick={() => setAutoRefresh(!autoRefresh)}
        className={`p-2 rounded flex items-center focus:ring-2 focus:ring-green-400 ${
          autoRefresh ? 'text-green-600' : 'text-gray-400'
        }`}
      >
        <RefreshCw className="w-5 h-5 mr-2" />
        <span className="hidden sm:inline">{t('auto_refresh')}</span>
      </button>
      <button
        onClick={exportData}
        className="p-2 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-green-400"
      >
        <Download className="w-5 h-5" />
      </button>
    </div>
  </div>
);

  // --- Compact KPI Bar (Sticky under Toolbar) ---
  const renderCompactKPIBar = () => (
    <div className="flex justify-around items-center h-10">
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-500">Revenue</span>
        <span className="font-semibold text-green-700 text-base">${metrics.revenue.value.toFixed(0)}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-500">Orders</span>
        <span className="font-semibold text-blue-700 text-base">{metrics.orders.value}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-500">Customers</span>
        <span className="font-semibold text-purple-700 text-base">{metrics.customers.value}</span>
      </div>
    </div>
  );

  // --- Home Tab ---
  const renderHomeTab = () => (
    <div className="space-y-6">
      {/* Large Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm flex flex-col items-start">
          <div className="flex items-center mb-2">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold">{t('revenue_overview')}</h3>
          </div>
          <div className="text-3xl font-bold mb-1">${metrics.revenue.value.toFixed(2)}</div>
          <div className="text-sm text-gray-500">{t(`this_${viewMode.toLowerCase()}`)}</div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm flex flex-col items-start">
          <div className="flex items-center mb-2">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold">{t('customer_stats')}</h3>
          </div>
          <div className="text-3xl font-bold mb-1">{metrics.customers.value}</div>
          <div className="text-sm text-gray-500">{t('active_customers')}</div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm flex flex-col items-start">
          <div className="flex items-center mb-2">
            <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold">{t('average_order_value')}</h3>
          </div>
          <div className="text-3xl font-bold mb-1">${metrics.avgOrderValue.value.toFixed(2)}</div>
          <div className="text-sm text-gray-500">{t('per_order')}</div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm flex flex-col items-start">
          <div className="flex items-center mb-2">
            <Package className="w-8 h-8 text-yellow-600 mr-3" />
            <h3 className="text-lg font-semibold">{t('total_orders')}</h3>
          </div>
          <div className="text-3xl font-bold mb-1">{metrics.orders.value}</div>
          <div className="text-sm text-gray-500">{t(`this_${viewMode.toLowerCase()}`)}</div>
        </div>
      </div>
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">{t('recent_activity')}</h3>
        <div className="space-y-4">
          {orders.slice(0, 5).map(order => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">
                  Order #{order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(order.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  {
                    new: 'bg-blue-100 text-blue-800',
                    preparing: 'bg-yellow-100 text-yellow-800',
                    on_the_way: 'bg-purple-100 text-purple-800',
                    delivered: 'bg-green-100 text-green-800',
                    cancelled: 'bg-red-100 text-red-800',
                  }[order.fulfillment_status]
                }`}
              >
                {t(order.fulfillment_status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- Orders Tab ---
  const renderOrdersTab = () => (
  <OrdersTable
    orders={orders}
    onStatusChange={handleStatusChange}
    statusFilter={statusFilter}
    holeFilter={holeFilter}
    search={search}
    setStatusFilter={setStatusFilter}
    setHoleFilter={setHoleFilter}
    setSearch={setSearch}
    onEdit={handleEditOrder}
    // Add any other props that OrdersTable expects!
  />
);

  // --- Menu Tab ---
  const renderMenuTab = () => (
    isAdmin ? <MenuManagement /> : null
  );

  // --- Settings Tab ---
  const renderSettingsTab = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">{t('profile_settings')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full px-3 py-2 md:py-3 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('role')}
            </label>
            <input
              type="text"
              value={role === 'admin' ? t('administrator') : t('employee')}
              disabled
              className="w-full px-3 py-2 md:py-3 border rounded-lg bg-gray-50"
            />
          </div>
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin_status')}
              </label>
              <input
                type="text"
                value={t('administrator')}
                disabled
                className="w-full px-3 py-2 md:py-3 border rounded-lg bg-green-50 text-green-800"
              />
            </div>
          )}
          <LanguageSelector />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">{t('notification_preferences')}</h3>
        <div className="space-y-4">
          <label className="flex items-center min-h-[44px]">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" />
            <span className="ml-2">{t('email_notifications')}</span>
          </label>
          <label className="flex items-center min-h-[44px]">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" />
            <span className="ml-2">{t('push_notifications')}</span>
          </label>
          <label className="flex items-center min-h-[44px]">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400"
            />
            <span className="ml-2">{t('sound_notifications')}</span>
          </label>
          {soundEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600 flex items-center">
                  <Volume2 className="w-4 h-4 mr-2" />
                  {t('notification_volume')}
                </label>
                <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-green-400"
              />
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">{t('danger_zone')}</h3>
        <button
          onClick={handleLogout}
          className="px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-400 min-h-[44px]"
        >
          {t('sign_out')}
        </button>
      </div>
    </div>
  );

  // --- Tab Switcher ---
  const renderContent = () => {
    switch(activeTab) {
      case 'home': return renderHomeTab();
      case 'orders': return renderOrdersTab();
      case 'menu': return renderMenuTab();
      case 'settings': return renderSettingsTab();
      default: return renderHomeTab();
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const visibleTabs = tabs.filter(tab => tab.adminOnly ? isAdmin : true);

  // --- Final Return ---
  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* Green Header */}
      <div className="sticky top-0 z-50 bg-green-600 text-white px-4 h-16 flex items-center font-bold text-lg">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 mr-3 text-white hover:bg-green-700 rounded-lg focus:ring-2 focus:ring-green-400"
          aria-label="Open navigation"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        {t('employee_dashboard')}
        <div className="flex-1" />
        <NotificationBell onNotificationClick={handleNotificationClick} />
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 text-white hover:bg-green-700 px-2 md:px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-400"
            aria-expanded={dropdownOpen}
          >
            <UserCircle className="w-5 h-5" />
            <span className="hidden sm:inline">{session?.user?.email}</span>
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}
            />
          </button>
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-20">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm text-gray-500">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session?.user?.email}
                  </p>
                  {isAdmin && (
                    <p className="text-xs text-green-600 font-medium">Administrator</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-green-400 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('sign_out')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky KPI Toolbar */}
      <div className="sticky top-16 z-40 bg-white border-b h-14 flex items-center">
        {renderToolbar()}
      </div>

      {/* Sticky Compact KPI Bar */}
      <div className="sticky top-[120px] z-30 bg-white border-b h-10">
        {renderCompactKPIBar()}
      </div>
            <span className="text-xs text-gray-500">{t('revenue')}</span>
      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">

        {renderContent()}

        {showOverlay && newOrder && (
          <NewOrderAlert
            holeNumber={newOrder.hole_number}
            customerName={newOrder.customer_name || 'Someone'}
            onDismiss={handleOverlayDismiss}
          />
        )}
      </main>

      {/* Mobile/Tablet Sidebar Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-56 bg-green-600 text-white p-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">FairwayMate</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-green-700 rounded-full focus:ring-2 focus:ring-green-400"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav>
              {visibleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-400 ${
                    activeTab === tab.id ? 'bg-green-700' : ''
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-3" />
                  {t(tab.label)}
                </button>
            <span className="text-xs text-gray-500">{t('customers')}</span>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}