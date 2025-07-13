import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { format, subDays } from 'date-fns';

import { supabase } from '../lib/supabase';
import { Calendar } from '../components/ui/calendar';
import NotificationBell from '../components/NotificationBell';
import NewOrderAlert from '../components/NewOrderAlert';
import { useUser } from '../hooks/useUser';

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
  path: string;
  adminOnly?: boolean;
}

const VIEW_MODES = ['Day', 'Week', 'Month'] as const;
type ViewMode = typeof VIEW_MODES[number];

const tabs: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'orders', label: 'Orders', icon: ClipboardList, path: '/dashboard/orders' },
  { id: 'menu', label: 'Menu', icon: MenuIcon, path: '/dashboard/menu', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
];

export default function EmployeeDashboard() {
  const { user, role, isAdmin, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // --- State ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('Day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Get current active tab from location
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'home';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/menu')) return 'menu';
    if (path.includes('/settings')) return 'settings';
    return 'home';
  };

  const activeTab = getCurrentTab();

  // --- Effect: Auth and Real-time Orders ---
  useEffect(() => {
    if (userLoading) return;
    if (!user || (role !== 'employee' && role !== 'admin')) {
      navigate('/');
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    
    const channel = supabase
      .channel('custom-all-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const insertedOrder = payload.new as Order;
        setNotificationCount(count => count + 1);
        if (showOverlay) {
          setPendingOrders(current => [...current, insertedOrder]);
        } else {
          setNewOrder(insertedOrder);
          setShowOverlay(true);
        }
      })
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
    navigate('/dashboard/orders');
  };

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
      console.error('Error signing out:', error);
    }
  };

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      viewMode,
      selectedDate: selectedDate.toISOString(),
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

  const handleTabClick = (tab: TabConfig) => {
    navigate(tab.path);
    setSidebarOpen(false);
  };

  // --- Toolbar ---
  const renderToolbar = () => (
    <div className="sticky top-0 z-40 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
      {/* Left: View modes and date controls */}
      <div className="flex items-center gap-2">
        {VIEW_MODES.map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors focus:ring-2 focus:ring-green-400 min-h-[44px] ${
              viewMode === mode ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode}
          </button>
        ))}
        <button
          onClick={() => handleDateChange('prev')}
          className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-green-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-gray-600 text-sm px-2">
          {format(selectedDate, 'dd MMM yyyy')}
        </span>
        <button
          onClick={() => handleDateChange('next')}
          className="p-2 hover:bg-gray-100 rounded-full focus:ring-2 focus:ring-green-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
            <div
              className="fixed inset-0 z-40 bg-black/10"
              onClick={() => setShowCalendar(false)}
              aria-label="Close calendar"
            />
            <div
              className="fixed z-50 bg-white rounded-lg shadow-xl p-1"
              style={{
                top: '120px',
                left: 'calc(50% - 125px)',
                minWidth: '250px',
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
                className="rounded-lg border border-gray-200 p-2"
              />
            </div>
          </>
        )}
      </div>
      
      {/* Right: Auto-refresh & Download */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`p-2 rounded flex items-center focus:ring-2 focus:ring-green-400 min-h-[44px] ${
            autoRefresh ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Auto-refresh</span>
        </button>
        <button
          onClick={exportData}
          className="p-2 text-gray-600 hover:text-gray-900 focus:ring-2 focus:ring-green-400 min-h-[44px] flex items-center justify-center"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const visibleTabs = tabs.filter(tab => tab.adminOnly ? isAdmin : true);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-60 lg:bg-green-600 lg:text-white">
        <div className="p-6">
          <h2 className="text-xl font-bold">FairwayMate</h2>
        </div>
        <nav className="flex-1 px-4">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-400 transition-colors ${
                activeTab === tab.id ? 'bg-green-700' : ''
              }`}
            >
              <tab.icon className="w-5 h-5 mr-3" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Green Header */}
        <div className="bg-green-600 text-white px-4 h-16 flex items-center font-bold text-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 mr-3 text-white hover:bg-green-700 rounded-lg focus:ring-2 focus:ring-green-400"
            aria-label="Open navigation"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          Employee Dashboard
          <div className="flex-1" />
          <NotificationBell
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

        {/* Toolbar */}
        {renderToolbar()}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet context={{ viewMode, selectedDate }} />
          
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
        <div className="fixed inset-0 z-50 flex lg:hidden">
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
                  onClick={() => handleTabClick(tab)}
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