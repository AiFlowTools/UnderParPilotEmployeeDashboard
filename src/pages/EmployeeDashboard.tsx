import React, { useState, useEffect } from 'react';
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
import NewOrderAlert from '../components/NewOrderAlert';

interface OrderItem {
  item_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  ordered_items: OrderItem[];
  total_price: number;
  status: string;
  fulfillment_status: 'new' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
  notes: string | null;
  hole_number: number;
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

const tabs: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const VIEW_MODES = ['Day', 'Week', 'Month'] as const;
type ViewMode = typeof VIEW_MODES[number];

export default function EmployeeDashboard() {
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
  const [newOrder, setNewOrder] = useState<Order | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    setActiveTab('orders');
    setStatusFilter('new-group');
  };

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

    const subscription = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders' 
        },
        (payload) => {
          const order = payload.new as Order;
          setNewOrder(order);
          setOrders(current => [order, ...current]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
  fetchOrders();
}, [statusFilter, holeFilter, search]);

const fetchOrders = async () => {
  setLoading(true);
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    if (statusFilter === 'new-group') {
      query = query.in('fulfillment_status', ['new', 'preparing', 'on_the_way']);
    } else {
      query = query.eq('fulfillment_status', statusFilter);
    }
  }

  if (holeFilter !== 'all') {
    query = query.eq('hole_number', Number(holeFilter));
  }

  if (search) {
    query = query.ilike('customer_name', `%${search}%`);
  }

  const { data, error } = await query;
  if (!error && data) setOrders(data as Order[]);
  setLoading(false);
};

  const renderHomeTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm px-4 py-2">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-[#28a745] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-[#28a745] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Auto-refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={<CreditCard />}
            label="Revenue"
            value={`$${metrics.revenue.value.toLocaleString()}`}
          />
          <MetricCard
            icon={<Package />}
            label="Orders"
            value={metrics.orders.value}
          />
          <MetricCard
            icon={<Users />}
            label="Customers"
            value={metrics.customers.value}
          />
          <MetricCard
            icon={<BarChart3 />}
            label="Avg. Order Value"
            value={`$${metrics.avgOrderValue.value.toLocaleString()}`}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer_name || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.fulfillment_status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.fulfillment_status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.fulfillment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.total_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOrdersTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Orders Management</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28a745] focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28a745] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="preparing">Preparing</option>
              <option value="on_the_way">On the Way</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={holeFilter}
              onChange={(e) => setHoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28a745] focus:border-transparent"
            >
              <option value="all">All Holes</option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => (
                <option key={hole} value={hole}>
                  Hole {hole}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hole
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customer_name || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500">{order.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.hole_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.ordered_items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.total_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.fulfillment_status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.fulfillment_status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.fulfillment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-[#28a745] hover:text-[#1e7e34]">
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-medium">New Order Alerts</p>
                  <p className="text-gray-500 text-sm">Receive notifications for new orders</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#28a745]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#28a745]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 font-medium">Order Status Updates</p>
                  <p className="text-gray-500 text-sm">Get notified when order status changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#28a745]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#28a745]"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Display Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Default View Mode</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28a745] focus:border-transparent"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                >
                  {VIEW_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Auto-refresh Interval</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#28a745] focus:border-transparent"
                  value={autoRefresh ? '30' : '0'}
                  onChange={(e) => setAutoRefresh(e.target.value !== '0')}
                >
                  <option value="0">Disabled</option>
                  <option value="30">Every 30 seconds</option>
                  <option value="60">Every minute</option>
                  <option value="300">Every 5 minutes</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {newOrder && (
        <NewOrderAlert
          holeNumber={newOrder.hole_number}
          onDismiss={() => setNewOrder(null)}
        />
      )}
      
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
        <header className="h-16 bg-[#28a745] flex items-center justify-between px-6 flex-shrink-0">
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
                <ChevronDown className="w-4 h-4 transition-transform duration-200" 
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
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
      <div className="w-8 h-8 text-[#28a745] mr-3">{icon}</div>
      <div>
        <p className="text-[#6c757d] text-sm">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}