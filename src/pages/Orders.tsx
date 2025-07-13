import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OutletContext {
  viewMode: 'Day' | 'Week' | 'Month';
  selectedDate: Date;
}

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
  hole?: string | number | null; // ADDED this, update as needed!
}

type SortField = 'created_at' | 'customer_name' | 'total_price' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Orders() {
  const { viewMode, selectedDate } = useOutletContext<OutletContext>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: 'created_at',
    direction: 'desc',
  });

  // Fetch orders with filters and sorting
  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase.from('orders').select('*');

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (searchQuery) {
        query = query.or(
          `customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%`
        );
      }
      // Apply sorting
      query = query.order(sortConfig.field, {
        ascending: sortConfig.direction === 'asc',
      });

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setOrders(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchOrders();
    // Set up real-time subscription
    const subscription = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              setOrders((current) => [payload.new as Order, ...current]);
              break;
            case 'UPDATE':
              setOrders((current) =>
                current.map((order) =>
                  order.id === payload.new.id ? (payload.new as Order) : order
                )
              );
              break;
            case 'DELETE':
              setOrders((current) =>
                current.filter((order) => order.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [statusFilter, searchQuery, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === 'asc'
          ? 'desc'
          : 'asc',
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="preparing">Preparing</option>
                <option value="on_the_way">On the Way</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {/* Date Range */}
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Viewing: {viewMode} - {format(selectedDate, 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Orders Table (Desktop Only, ≥1024px) */}
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <AlertCircle className="w-6 h-6 mr-2" />
              <span>{error}</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('customer_name')}>
                    <div className="flex items-center">
                      Customer
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hole
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    {/* Customer */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{order.customer_name || 'N/A'}</div>
                      {order.customer_email && (
                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                      )}
                    </td>
                    {/* Hole */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.hole || '-'}
                    </td>
                    {/* Items */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <ul>
                        {order.ordered_items.map((item, idx) => (
                          <li key={idx}>
                            {item.quantity}x {item.item_name}
                          </li>
                        ))}
                      </ul>
                    </td>
                    {/* Notes */}
                    <td className="px-6 py-4 text-sm">
                      {order.notes
                        ? <span className="bg-yellow-100 text-yellow-900 px-2 py-1 rounded">{order.notes}</span>
                        : <span className="text-gray-400">-</span>
                      }
                    </td>
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        {
                          new: 'bg-blue-100 text-blue-800',
                          preparing: 'bg-yellow-100 text-yellow-800',
                          on_the_way: 'bg-purple-100 text-purple-800',
                          delivered: 'bg-green-100 text-green-800',
                          cancelled: 'bg-red-100 text-red-800',
                        }[order.fulfillment_status]
                      }`}>
                        {order.fulfillment_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    {/* Date/Time */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Card/List View for Mobile & Tablet (below 1024px) */}
        <div className="block lg:hidden space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <AlertCircle className="w-6 h-6 mr-2" />
              <span>{error}</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex justify-center items-center h-32 text-gray-500">
              No orders found.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="font-semibold text-gray-900">
                    {order.customer_name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {order.customer_email}
                  </div>
                  <div className="text-base font-semibold">
                    Hole: <span className="text-gray-700">{order.hole || '-'}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.fulfillment_status === 'new'
                        ? 'bg-blue-100 text-blue-800'
                        : order.fulfillment_status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.fulfillment_status === 'preparing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.fulfillment_status === 'on_the_way'
                        ? 'bg-purple-100 text-purple-800'
                        : order.fulfillment_status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.fulfillment_status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {order.ordered_items.map((item, idx) => (
                    <div key={idx}>
                      {item.quantity}x {item.item_name}
                    </div>
                  ))}
                </div>
                {order.notes && (
                  <div className="bg-yellow-100 text-yellow-900 px-2 py-1 rounded text-xs">
                    Note: {order.notes}
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
