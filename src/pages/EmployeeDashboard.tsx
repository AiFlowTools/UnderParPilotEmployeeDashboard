import React, { useState, useEffect } from 'react';
import NewOrderAlert from '../components/NewOrderAlert';
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
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';

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
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center">
      <div className="p-2 bg-green-100 rounded-lg text-green-600 mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const tabs: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const VIEW_MODES = ['Day', 'Week', 'Month'] as const;
type ViewMode = typeof VIEW_MODES[number];

export default function EmployeeDashboard() {
  // 🔔 Uber Eats-style overlay additions
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return navigate('/login');
      setSession(session);
      supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.role !== 'employee') navigate('/');
        });
    });

    const channel = supabase
  .channel('custom-all-orders') // can be any name
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
    },
    (payload) => {
      const insertedOrder = payload.new as Order;
      console.log("🔥 New order received via subscription", insertedOrder);
      setOrders(curr => [insertedOrder, ...curr]);
      setNewOrder(insertedOrder);
      setShowOverlay(true);
    }
  )
  .subscribe();


    return () => subscription.unsubscribe();
  }, [navigate]);

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
        console.error('Failed to update order status:', error);
        setError('Failed to update order status. Please try again.');
        return;
      }

      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
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
      console.error('Logout failed:', error);
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

  const renderMetricsTable = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              {VIEW_MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-600">
                {format(selectedDate, 'dd MMM yyyy')}
              </span>
              <button
                onClick={() => handleDateChange('next')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg flex items-center ${
                autoRefresh ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Auto-refresh
            </button>
            <button
              onClick={exportData}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(metrics).map(([key, data]) => (
            <div key={key} className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">
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
                    <span className={`text-sm ${
                      data.trend === 'up' ? 'text-green-500' : 
                      data.trend === 'down' ? 'text-red-500' : 
                      'text-gray-500'
                    }`}>
                      {Math.abs(data.change).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  vs previous {viewMode.toLowerCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHomeTab = () => (
    <div className="space-y-6">
      {renderMetricsTable()}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">${metrics.revenue.value.toFixed(2)}</p>
              <p className="text-sm text-gray-500">This {viewMode.toLowerCase()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Customer Stats</h3>
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{metrics.customers.value}</p>
              <p className="text-sm text-gray-500">Active customers</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Average Order Value</h3>
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">${metrics.avgOrderValue.value.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Per order</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(order.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                {
                  new: 'bg-blue-100 text-blue-800',
                  preparing: 'bg-yellow-100 text-yellow-800',
                  on_the_way: 'bg-purple-100 text-purple-800',
                  delivered: 'bg-green-100 text-green-800',
                  cancelled: 'bg-red-100 text-red-800'
                }[order.fulfillment_status]
              }`}>
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
      <div className="bg-white rounded-lg shadow-sm p-6">
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
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value="Employee"
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600" />
            <span className="ml-2">Email notifications for new orders</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600" />
            <span className="ml-2">Push notifications for order updates</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard icon={<Package />} label="New Orders" value={metrics.orders.value} />
        <MetricCard icon={<Clock />} label="In Progress" value={metrics.orders.value} />
        <MetricCard icon={<TrendingUp />} label="Delivered Today" value={metrics.orders.value} />
        <MetricCard icon={<Timer />} label="Avg Prep Time" value="15 min" />
      </div>

      <div className="flex gap-4 mb-6">
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value as any)} 
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28a745]"
        >
          <option value="all">ALL</option>
          <option value="new-group">New</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select 
          value={holeFilter} 
          onChange={e => setHoleFilter(e.target.value)} 
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28a745]"
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
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28a745]" 
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Customer', 'Hole', 'Items', 'Notes', 'Date & Time', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.id.slice(0,8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer_name || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.hole_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.ordered_items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {order.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(order.fulfillment_status !== 'delivered' && order.fulfillment_status !== 'cancelled') && (
                      <div className="relative inline-block">
                        <select
                          value={order.fulfillment_status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          className="appearance-none pl-2 pr-6 py-1 border rounded bg-white text-sm"
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
      )}
    </div>
  );

  const handleNotificationClick = () => {
    setActiveTab('orders');
    setStatusFilter('new-group');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-[#1e7e34] text-white flex-shrink-0">
        <div className="p-4">
          <h1 className="text-2xl font-bold">UnderPar</h1>
        </div>
        <nav className="mt-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center w-full px-6 py-3 hover:bg-[#28a745] transition-colors ${
                activeTab === tab.id ? 'bg-[#28a745]' : ''
              }`}
            >
              <tab.icon className="w-5 h-5 mr-3" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#28a745]  flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-white text-xl font-semibold">Employee Dashboard</h1>

          <div className="flex items-center space-x-4">
            <NotificationBell onNotificationClick={handleNotificationClick} />

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 text-white hover:bg-[#1e7e34] px-3 py-2 rounded-lg transition-colors duration-200"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <UserCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{session?.user?.email}</span>
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-200"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />

                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session?.user?.email}
                      </p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2 inline-block" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f8f9fa] p-6">
          {activeTab === 'home' && renderHomeTab()}
          {activeTab === 'orders' && renderOrdersTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </main>

        {/* 🔔 FULL-SCREEN OVERLAY COMPONENT */}
        {showOverlay && newOrder && (
  <div
    onClick={() => setShowOverlay(false)}
    className="fixed inset-0 z-50 bg-black bg-opacity-90 text-white flex items-center justify-center text-center p-6 cursor-pointer"
  >
    <div className="space-y-4 max-w-md mx-auto">
      <h1 className="text-5xl font-bold">🚨 New Order</h1>
      <p className="text-3xl">Hole #{newOrder.hole_number}</p>
      <p className="text-xl">
        {(newOrder.customer_name || 'Someone')} just placed an order.
      </p>
      <p className="text-sm opacity-70">Tap anywhere to dismiss</p>
    </div>
  </div>
)}
