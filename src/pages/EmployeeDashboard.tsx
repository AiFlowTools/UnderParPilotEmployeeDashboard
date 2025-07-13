import React, { useState, useEffect } from 'react';
import NewOrderAlert from '../components/NewOrderAlert';
import MenuManagement from '../components/MenuManagement';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
  Home,
  Settings,
  ClipboardList,
  Package,
  Clock,
  Timer,
  TrendingUp,
  Search,
  ChevronDown,
  LogOut,
  BarChart3,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  UserCircle,
  Volume2,
  Menu as MenuIcon,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';
import { useUser } from '../hooks/useUser';
import { Calendar } from '../components/ui/calendar';

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

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value }) => (
  <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
    <div className="flex items-center">
      <div className="p-2 bg-green-100 rounded-lg text-green-600 mr-3 md:mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg md:text-xl font-semibold mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const tabs: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'menu', label: 'Menu', icon: MenuIcon, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const VIEW_MODES = ['Day', 'Week', 'Month'] as const;
type ViewMode = typeof VIEW_MODES[number];

export default function EmployeeDashboard() {
  const { user, role, isAdmin, loading: userLoading } = useUser();
  const navigate = useNavigate();

  // Sidebar state for mobile/tablet
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sound control states
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved === null ? true : saved === 'true';
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('notificationVolume');
    return saved === null ? 0.8 : parseFloat(saved);
  });

  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const [activeTab, setActiveTab] = useState('home');
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('new');
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
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Save sound preferences to localStorage
  useEffect(() => {
    localStorage.setItem('soundEnabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('notificationVolume', volume.toString());
  }, [volume]);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      navigate('/');
      return;
    }

    if (role !== 'employee' && role !== 'admin') {
      navigate('/');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const channel = supabase
      .channel('custom-all-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const insertedOrder = payload.new as Order;
          setOrders(curr => [insertedOrder, ...curr]);
          setNotificationCount(count => count + 1);
          
          if (showOverlay) {
            setPendingOrders(current => [...current, insertedOrder]);
          } else {
            setNewOrder(insertedOrder);
            setShowOverlay(true);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
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
    setNotificationCount(0);
    setActiveTab('orders');
    setStatusFilter('new-group');
  };

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from<Order>('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter === 'new-group') {
        query = query.in('fulfillment_status', ['new', 'preparing', 'on_the_way']);
      } else if (statusFilter === 'completed') {
        query = query.eq('fulfillment_status', 'delivered');
      } else if (statusFilter === 'cancelled') {
        query = query.eq('fulfillment_status', 'cancelled');
      }

      if (holeFilter !== 'all') {
        query = query.eq('hole_number', Number(holeFilter));
      }

      if (search) {
        query = query.ilike('ordered_items', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setOrders(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, holeFilter, search]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ fulfillment_status: newStatus })
        .eq('id', orderId)
        .select();

      if (error) {
        setError('Failed to update order status. Please try again.');
        return;
      }

      await fetchOrders();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchMetrics();
      }, 5 * 60 * 1000);
    }
    return () => clearInterval(intervalId);
  }, [autoRefresh]);

  const getDateRange = () => {
    const now = selectedDate;
    switch (viewMode) {
      case 'Day':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
          previous: {
            start: startOfDay(subDays(now, 1)),
            end: endOfDay(subDays(now, 1)),
          },
        };
      case 'Week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now),
          previous: {
            start: startOfWeek(subDays(now, 7)),
            end: endOfWeek(subDays(now, 7)),
          },
        };
      case 'Month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          previous: {
            start: startOfMonth(subDays(now, 30)),
            end: endOfMonth(subDays(now, 30)),
          },
        };
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    const dateRange = getDateRange();

    try {
      const { data: currentOrders, error: currentError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (currentError) throw currentError;

      const { data: previousOrders, error: previousError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.previous.start.toISOString())
        .lte('created_at', dateRange.previous.end.toISOString());

      if (previousError) throw previousError;

      const calculateMetrics = (orders: Order[]) => {
        const revenue = orders.reduce((sum, order) => 
          sum + order.ordered_items.reduce((total, item) => total + (item.price * item.quantity), 0), 0);
        const uniqueCustomers = new Set(orders.map(o => o.id)).size;
        const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;

        return {
          revenue,
          orders: orders.length,
          customers: uniqueCustomers,
          avgOrderValue,
        };
      };

      const current = calculateMetrics(currentOrders || []);
      const previous = calculateMetrics(previousOrders || []);

      setMetrics({
        revenue: {
          value: current.revenue,
          previousValue: previous.revenue,
          change: previous.revenue ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
          trend: current.revenue >= previous.revenue ? 'up' : 'down',
        },
        orders: {
          value: current.orders,
          previousValue: previous.orders,
          change: previous.orders ? ((current.orders - previous.orders) / previous.orders) * 100 : 0,
          trend: current.orders >= previous.orders ? 'up' : 'down',
        },
        customers: {
          value: current.customers,
          previousValue: previous.customers,
          change: previous.customers ? ((current.customers - previous.customers) / previous.customers) * 100 : 0,
          trend: current.customers >= previous.customers ? 'up' : 'down',
        },
        avgOrderValue: {
          value: current.avgOrderValue,
          previousValue: previous.avgOrderValue,
          change: previous.avgOrderValue ? ((current.avgOrderValue - previous.avgOrderValue) / previous.avgOrderValue) * 100 : 0,
          trend: current.avgOrderValue >= previous.avgOrderValue ? 'up' : 'down',
        },
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [viewMode, selectedDate]);

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
      navigate('/', { replace: true });
      window.history.pushState(null, '', '/');
    } catch (error) {
      // Optionally handle logout errors
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

        {/* Calendar, Auto-refresh & Export */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="p-2 md:p-3 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-green-400 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
              title="Select date"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            {showCalendar && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowCalendar(false)}
                />
                <div className="absolute right-0 mt-2 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={date => {
                      if (date) {
                        setSelectedDate(date)
                        setShowCalendar(false)
                      }
                    }}
                    className="rounded-lg"
                    initialFocus
                  />
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 md:p-3 rounded-lg flex items-center focus:ring-2 focus:ring-green-400 min-h-[44px] ${
              autoRefresh ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Auto-refresh</span>
          </button>
          <button
            onClick={exportData}
            className="p-2 md:p-3 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-green-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
    

      {/* KPI Cards Grid */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(metrics).map(([key, data]) => (
            <div key={key} className="bg-gray-50 p-4 md:p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xl md:text-2xl font-bold">
                    {key === 'revenue' || key === 'avgOrderValue'
                      ? `$${data.value.toFixed(2)}`
                      : data.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {data.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-green-500" />
                    ) : data.trend === 'down' ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : null}
                    <span
                      className={`text-sm ${
                        data.trend === 'up'
                          ? 'text-green-500'
                          : data.trend === 'down'
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {Math.abs(data.change).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-xs md:text-sm text-gray-500">
                  vs previous {viewMode.toLowerCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  );

  // --- Home Tab ---
  const renderHomeTab = () => (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-xl md:text-2xl font-bold">
                ${metrics.revenue.value.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                This {viewMode.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Customer Stats</h3>
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-xl md:text-2xl font-bold">
                {metrics.customers.value}
              </p>
              <p className="text-sm text-gray-500">Active customers</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm md:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Average Order Value</h3>
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-xl md:text-2xl font-bold">
                ${metrics.avgOrderValue.value.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Per order</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
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
                {order.fulfillment_status.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
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
              Role
            </label>
            <input
              type="text"
              value={role === 'admin' ? 'Administrator' : 'Employee'}
              disabled
              className="w-full px-3 py-2 md:py-3 border rounded-lg bg-gray-50"
            />
          </div>
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Status
              </label>
              <input
                type="text"
                value="Administrator"
                disabled
                className="w-full px-3 py-2 md:py-3 border rounded-lg bg-green-50 text-green-800"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center min-h-[44px]">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" />
            <span className="ml-2">Email notifications for new orders</span>
          </label>
          <label className="flex items-center min-h-[44px]">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" />
            <span className="ml-2">Push notifications for order updates</span>
          </label>
          <label className="flex items-center min-h-[44px]">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400"
            />
            <span className="ml-2">Enable sound for new orders</span>
          </label>
          {soundEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600 flex items-center">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Notification volume
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
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <button
          onClick={handleLogout}
          className="px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-400 min-h-[44px]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={<Package />} label="New Orders" value={metrics.orders.value} />
        <MetricCard icon={<Clock />} label="In Progress" value={metrics.orders.value} />
        <MetricCard icon={<TrendingUp />} label="Delivered Today" value={metrics.orders.value} />
        <MetricCard icon={<Timer />} label="Avg Prep Time" value="15 min" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value as any)} 
          className="px-3 md:px-4 py-2 md:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 min-h-[44px]"
        >
          <option value="all">ALL</option>
          <option value="new-group">New</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select 
          value={holeFilter} 
          onChange={e => setHoleFilter(e.target.value)} 
          className="px-3 md:px-4 py-2 md:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 min-h-[44px]"
        >
          <option value="all">All Holes</option>
          {[...Array(18)].map((_, i) => (
            <option key={i+1} value={i+1}>Hole {i+1}</option>
          ))}
        </select>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search orders..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 md:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 min-h-[44px]" 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-700">
          <p>{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['ID', 'Customer', 'Hole', 'Items', 'Notes', 'Date & Time', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.id.slice(0,8)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer_name || 'Anonymous'}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.hole_number}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900">
                      {order.ordered_items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-500">
                      {order.notes || '-'}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        {
                          new: 'bg-blue-100 text-blue-800',
                          preparing: 'bg-yellow-100 text-yellow-800',
                          on_the_way: 'bg-purple-100 text-purple-800',
                          delivered: 'bg-green-100 text-green-800',
                          cancelled: 'bg-red-100 text-red-800'
                        }[order.fulfillment_status]
                      }`}>
                        {order.fulfillment_status.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(order.fulfillment_status !== 'delivered' && order.fulfillment_status !== 'cancelled') && (
                        <div className="relative inline-block">
                          <select
                            value={order.fulfillment_status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            className="appearance-none pl-2 pr-6 py-1 md:py-2 border rounded bg-white text-sm focus:ring-2 focus:ring-green-400 min-h-[44px]"
                          >
                            <option value="new">New</option>
                            <option value="preparing">Preparing</option>
                            <option value="on_the_way">On the Way</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return renderHomeTab();
      case 'orders':
        return renderOrdersTab();
      case 'menu':
        return isAdmin ? <MenuManagement /> : null;
      case 'settings':
        return renderSettingsTab();
      default:
        return renderHomeTab();
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const visibleTabs = tabs.filter(tab => {
    if (tab.adminOnly) {
      return isAdmin;
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Green Header */}
        <div className="sticky top-0 z-50 bg-green-600 text-white px-4 h-16 flex items-center font-bold text-lg">
          <div className="flex items-center">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 mr-3 text-white hover:bg-green-700 rounded-lg focus:ring-2 focus:ring-green-400"
              aria-label="Open navigation"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-white text-lg md:text-xl font-semibold">Employee Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell
              count={notificationCount}
              onNotificationClick={handleNotificationClick}
            />
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
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

         // --- Metrics Table (KPI Header) ---
  const renderMetricsTable = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Entire KPI Strip: toolbar + cards */}
      <div
        className="
          sticky top-16 z-40 bg-white
          px-4 md:px-6 py-4
          flex flex-col items-center justify-center
          sm:flex-row sm:items-center sm:justify-between
          border-b border-gray-200 gap-4
        ">
         {renderToolbar()} 
      
        {/* View Mode Buttons & Date Nav */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex space-x-1">
            {VIEW_MODES.map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-colors focus:ring-2 focus:ring-green-400 min-h-[44px] ${
                  viewMode === mode
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 md:p-3 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-green-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-gray-600 text-sm md:text-base px-2">
              {format(selectedDate, 'dd MMM yyyy')}
            </span>
            <button
              onClick={() => handleDateChange('next')}
              className="p-2 md:p-3 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-green-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

       {/* Sticky Compact KPI Header */}
 <div className="sticky top-[120px] z-30 bg-white border-b h-10 flex items-center px-2 justify-around">
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

        {/* Scrollable Dashboard Content */}
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
      </div>

      {/* Mobile/Tablet Sidebar Drawer Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer panel */}
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
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
