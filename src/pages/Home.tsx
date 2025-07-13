import React, { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart3,
  Users,
  CreditCard,
  Package,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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

type ViewMode = 'Day' | 'Week' | 'Month';

interface HomeProps {
  viewMode: ViewMode;
  selectedDate: Date;
}

export default function Home({ viewMode, selectedDate }: HomeProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    revenue: { value: 0, previousValue: 0, change: 0, trend: 'neutral' },
    orders: { value: 0, previousValue: 0, change: 0, trend: 'neutral' },
    customers: { value: 0, previousValue: 0, change: 0, trend: 'neutral' },
    avgOrderValue: { value: 0, previousValue: 0, change: 0, trend: 'neutral' },
  });

  const getDateRange = () => {
    const now = selectedDate;
    switch (viewMode) {
      case 'Day': 
        return { 
          start: startOfDay(now), 
          end: endOfDay(now), 
          previous: { 
            start: startOfDay(subDays(now, 1)), 
            end: endOfDay(subDays(now, 1)) 
          } 
        };
      case 'Week': 
        return { 
          start: startOfWeek(now), 
          end: endOfWeek(now), 
          previous: { 
            start: startOfWeek(subDays(now, 7)), 
            end: endOfWeek(subDays(now, 7)) 
          } 
        };
      case 'Month': 
        return { 
          start: startOfMonth(now), 
          end: endOfMonth(now), 
          previous: { 
            start: startOfMonth(subDays(now, 30)), 
            end: endOfMonth(subDays(now, 30)) 
          } 
        };
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    const dateRange = getDateRange();
    
    try {
      const { data: currentOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
      
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.previous.start.toISOString())
        .lte('created_at', dateRange.previous.end.toISOString());

      const calculateMetrics = (orders: Order[]) => {
        const revenue = orders.reduce((sum, order) => 
          sum + order.ordered_items.reduce((total, item) => 
            total + (item.price * item.quantity), 0), 0);
        const uniqueCustomers = new Set(orders.map(o => o.customer_name)).size;
        const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;
        return { revenue, orders: orders.length, customers: uniqueCustomers, avgOrderValue };
      };

      const current = calculateMetrics(currentOrders || []);
      const previous = calculateMetrics(previousOrders || []);

      setMetrics({
        revenue: {
          value: current.revenue,
          previousValue: previous.revenue,
          change: previous.revenue ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
          trend: current.revenue >= previous.revenue ? 'up' : 'down'
        },
        orders: {
          value: current.orders,
          previousValue: previous.orders,
          change: previous.orders ? ((current.orders - previous.orders) / previous.orders) * 100 : 0,
          trend: current.orders >= previous.orders ? 'up' : 'down'
        },
        customers: {
          value: current.customers,
          previousValue: previous.customers,
          change: previous.customers ? ((current.customers - previous.customers) / previous.customers) * 100 : 0,
          trend: current.customers >= previous.customers ? 'up' : 'down'
        },
        avgOrderValue: {
          value: current.avgOrderValue,
          previousValue: previous.avgOrderValue,
          change: previous.avgOrderValue ? ((current.avgOrderValue - previous.avgOrderValue) / previous.avgOrderValue) * 100 : 0,
          trend: current.avgOrderValue >= previous.avgOrderValue ? 'up' : 'down'
        }
      });

      // Also fetch recent orders for activity
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setOrders(recentOrders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [viewMode, selectedDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Large Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm flex flex-col items-start">
          <div className="flex items-center mb-2">
            <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold">Revenue Overview</h3>
          </div>
          <div className="text-3xl font-bold mb-1">${metrics.revenue.value.toFixed(2)}</div>
          <div className="text-sm text-gray-500">This {viewMode.toLowerCase()}</div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm flex flex-col items-start">
          <div className="flex items-center mb-2">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold">Customer Stats</h3>
          </div>
          <div className="text-3xl font-bold mb-1">{metrics.customers.value}</div>
          <div className="text-sm text-gray-500">Active customers</div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm flex flex-col items-start">
          <div className="flex items-center mb-2">
            <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold">Average Order Value</h3>
          </div>
          <div className="text-3xl font-bold mb-1">${metrics.avgOrderValue.value.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Per order</div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm flex flex-col items-start">
          <div className="flex items-center mb-2">
            <Package className="w-8 h-8 text-yellow-600 mr-3" />
            <h3 className="text-lg font-semibold">Total Orders</h3>
          </div>
          <div className="text-3xl font-bold mb-1">{metrics.orders.value}</div>
          <div className="text-sm text-gray-500">This {viewMode.toLowerCase()}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {orders.map(order => (
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
}