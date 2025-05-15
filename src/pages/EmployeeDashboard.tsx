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

  // ... (rest of the component implementation remains exactly the same as in the original file)

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