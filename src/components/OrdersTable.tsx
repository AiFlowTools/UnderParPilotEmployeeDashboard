import React from 'react';
import { format } from 'date-fns';

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
  hole_number?: number | null; // this matches your dashboard usage
}

interface OrdersTableProps {
  orders: Order[];
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onStatusChange }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
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
          {orders.map(order => (
            <tr key={order.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="font-medium">{order.customer_name || 'N/A'}</div>
                {order.customer_email && (
                  <div className="text-xs text-gray-500">{order.customer_email}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {order.hole_number ?? '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                <ul>
                  {order.ordered_items.map((item, idx) => (
                    <li key={idx}>
                      {item.quantity}x {item.item_name}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4 text-sm">
                {order.notes
                  ? <span className="bg-yellow-100 text-yellow-900 px-2 py-1 rounded">{order.notes}</span>
                  : <span className="text-gray-400">-</span>
                }
              </td>
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
              <td className="px-6 py-4 text-sm text-gray-500">
                {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {(order.fulfillment_status !== "delivered" && order.fulfillment_status !== "cancelled" && onStatusChange) ? (
                  <select
                    value={order.fulfillment_status}
                    onChange={e => onStatusChange(order.id, e.target.value as Order['fulfillment_status'])}
                    className="appearance-none pl-2 pr-6 py-1 md:py-2 border rounded bg-white text-sm focus:ring-2 focus:ring-green-400 min-h-[44px]"
                  >
                    <option value="new">New</option>
                    <option value="preparing">Preparing</option>
                    <option value="on_the_way">On the Way</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default OrdersTable;
