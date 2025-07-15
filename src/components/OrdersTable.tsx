import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';

interface OrderItem {
  item_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_email?: string | null;
  ordered_items: OrderItem[];
  total_price?: number;
  status?: string;
  fulfillment_status: 'new' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
  notes: string | null;
  hole_number?: number | null;
}

interface OrdersTableProps {
  orders: Order[];
  onStatusChange?: (orderId: string, newStatus: string) => void;
  onEdit?: (orderId: string)=> void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onStatusChange, onEdit }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'completed' | 'cancelled'>('all');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editStatusTemp, setEditStatusTemp] = useState<Order['fulfillment_status'] | null>(null);

  // Filter logic
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'new') return order.fulfillment_status === 'new';
    if (statusFilter === 'completed') return order.fulfillment_status === 'delivered';
    if (statusFilter === 'cancelled') return order.fulfillment_status === 'cancelled';
    return true;
  });
  
  return (
    <div>
      {/* Filter Dropdown */}
      <div className="flex gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="all">All Orders</option>
          <option value="new">New</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

     {/* Desktop Table */}
<div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hole</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredOrders.map(order => (
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
            {order.hole_number ?? '-'}
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
          {/* Status badge (NO dropdown, NO chevron) */}
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
          {/* Action column: dropdown (with chevron) or static text */}
          <td className="px-6 py-4 whitespace-nowrap">
            {(order.fulfillment_status !== "delivered" && order.fulfillment_status !== "cancelled" && onStatusChange) ? (
              <div className="relative">
                <select
                  value={order.fulfillment_status}
                  onChange={e => onStatusChange(order.id, e.target.value as Order['fulfillment_status'])}
                  className="appearance-none pl-2 pr-6 py-1 md:py-2 border rounded bg-white text-sm focus:ring-2 focus:ring-green-400 min-h-[44px] w-full"
                >
                  <option value="new">New</option>
                  <option value="preparing">Preparing</option>
                  <option value="on_the_way">On the Way</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {/* ChevronDown only in the dropdown */}
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            ) : (
              <span>{order.fulfillment_status.replace(/_/g, ' ')}</span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {/* Mobile/Tablet Card/List View */}
      <div className="block lg:hidden space-y-3">
          {filteredOrders.length === 0 ? (
          <div className="flex justify-center items-center h-32 text-gray-500">
            No orders found.
          </div>
        ) : (
          filteredOrders.map(order => (
  <div key={order.id} className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-3 mb-2">
    {/* Header row */}
    <div className="flex items-center justify-between">
      <div className="font-bold text-lg text-gray-900">{order.customer_name || 'N/A'}</div>
      <div className="flex items-center gap-2">
        {editingOrderId === order.id ? (
          <>
            <button
              className="px-4 py-2 rounded bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-colors"
              onClick={() => {
                setEditingOrderId(null);
                setEditStatusTemp(null); // optional, see below
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
              onClick={() => {
                // Only save if changed
                if (editStatusTemp && editStatusTemp !== order.fulfillment_status) {
                  onStatusChange?.(order.id, editStatusTemp);
                }
                setEditingOrderId(null);
                setEditStatusTemp(null);
              }}
            >
              Save
            </button>
          </>
        ) : (
          <button
            className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
            onClick={() => {
              setEditingOrderId(order.id);
              setEditStatusTemp(order.fulfillment_status); // optional temp state
            }}
          >
            Edit
          </button>
        )}
        {/* Status badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
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
        }`}>
          {order.fulfillment_status.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
    {/* Rest of card... */}
    <div className="flex justify-between items-center text-sm text-gray-500">
      <span className="font-semibold">Hole {order.hole_number ?? '-'}</span>
      <span>{format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}</span>
    </div>
    <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
      {order.ordered_items.map((item, idx) => (
        <div key={idx}>
          <span className="font-medium">{item.quantity}x {item.item_name}</span>
        </div>
      ))}
    </div>
    {order.notes && (
      <div className="bg-yellow-50 text-yellow-900 px-2 py-1 rounded text-xs">
        <b>Note:</b> {order.notes}
      </div>
    )}
    {/* Status dropdown, only while editing */}
    {editingOrderId === order.id && (
      <div className="mt-2">
        <select
          value={editStatusTemp ?? order.fulfillment_status}
          onChange={e => setEditStatusTemp(e.target.value as Order['fulfillment_status'])}
          className="appearance-none pl-2 pr-6 py-2 border-2 border-green-500 bg-green-50 font-semibold rounded-lg text-sm focus:ring-2 focus:ring-green-400 w-full shadow"
        >
          <option value="new">New</option>
          <option value="preparing">Preparing</option>
          <option value="on_the_way">On the Way</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    )}
  </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
