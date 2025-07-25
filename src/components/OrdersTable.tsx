import React, { useState } from 'react';
import { format } from 'date-fns';
import { Check, ChevronDown, Dot } from 'lucide-react';
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react'
import { useTranslation } from 'react-i18next';

const statusOptions = [
  {
    value: 'all',
    label: 'all_statuses',
    color: 'bg-gray-200 text-gray-700',
    icon: <Dot className="w-4 h-4 text-gray-400" />,
  },
  {
    value: 'new',
    label: 'new',
    color: 'bg-blue-100 text-blue-800',
    icon: <Dot className="w-4 h-4 text-blue-400" />,
  },
  {
    value: 'completed',
    label: 'delivered',
    color: 'bg-green-100 text-green-800',
    icon: <Dot className="w-4 h-4 text-green-400" />,
  },
  {
    value: 'cancelled',
    label: 'cancelled',
    color: 'bg-red-100 text-red-800',
    icon: <Dot className="w-4 h-4 text-red-400" />,
  },
];

// Newest/Oldest Sort
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

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

const StatusFilterDropdown = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
  <Listbox value={value} onChange={onChange}>
    {({ open }) => (
      <div className="relative min-w-[160px]">
        <Listbox.Button className={`flex items-center justify-between w-full rounded-xl shadow border px-4 py-2 font-semibold bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition`}>
          <span className="flex items-center gap-2">
            {statusOptions.find(o => o.value === value)?.icon}
            <span className={statusOptions.find(o => o.value === value)?.color + " px-2 py-1 rounded-full"}>
              {statusOptions.find(o => o.value === value)?.label}
            </span>
          </span>
          <ChevronDown className="w-5 h-5 text-gray-400 ml-2" />
        </Listbox.Button>
        <Transition
          as={Fragment}
          show={open}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute mt-1 w-full bg-white shadow-lg max-h-60 rounded-xl py-1 ring-1 ring-black ring-opacity-5 z-10 focus:outline-none">
            {statusOptions.map(option => (
              <Listbox.Option
                key={option.value}
                value={option.value}
                className={({ active }) =>
                  `cursor-pointer select-none relative flex items-center gap-2 px-4 py-2 rounded-lg ${
                    active ? 'bg-green-100' : ''
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    {option.icon}
                    <span className={option.color + " px-2 py-1 rounded-full"}>
                      {option.label}
                    </span>
                    {selected ? (
                      <Check className="w-4 h-4 text-green-500 ml-auto" />
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    )}
  </Listbox>
);

export const SortDropdown = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => (
  <Listbox value={value} onChange={onChange}>
    {({ open }) => (
      <div className="relative w-40">
        <Listbox.Button
          className={`
            flex items-center justify-between w-full px-4 py-2 rounded-xl border
            font-semibold bg-white text-base shadow-sm transition
            focus:outline-none focus:ring-2 focus:ring-green-400
            ${open ? "ring-2 ring-green-200 border-green-400" : "border-gray-200"}
          `}
        >
          <span>{sortOptions.find(o => o.value === value)?.label}</span>
          <ChevronDown
            className={`
              w-5 h-5 ml-2 text-gray-400 transform transition-transform duration-200
              ${open ? "rotate-180" : ""}
            `}
          />
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options
            className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 focus:outline-none"
          >
            {sortOptions.map(option => (
              <Listbox.Option
                key={option.value}
                value={option.value}
                className={({ active, selected }) =>
                  `px-4 py-2 cursor-pointer transition flex items-center rounded-lg
                  ${active ? "bg-green-50 text-green-700" : ""}
                  ${selected ? "font-bold text-green-600" : "text-gray-700"}`
                }
              >
                {option.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    )}
  </Listbox>
);

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onStatusChange, onEdit }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'completed' | 'cancelled'>('all');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editStatusTemp, setEditStatusTemp] = useState<Order['fulfillment_status'] | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { t } = useTranslation();

  // Filter logic
    const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'new') return order.fulfillment_status === 'new';
    if (statusFilter === 'completed') return order.fulfillment_status === 'delivered';
    if (statusFilter === 'cancelled') return order.fulfillment_status === 'cancelled';
    return true;
  });
 
  // Filtered Result
  const sortedOrders = filteredOrders.sort((a, b) => {
  if (sortOrder === 'newest') {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
});
  
   return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4">
        <div className="w-full md:w-1/3">
          <StatusFilterDropdown value={statusFilter} onChange={val => setStatusFilter(val as any)} />
        </div>
        <div className="w-full md:w-1/3">
          <SortDropdown value={sortOrder} onChange={val => setSortOrder(val as 'newest' | 'oldest')} />
        </div>
      </div>

      {/* --- Desktop Table --- */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('customer')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('hole')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('items')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('notes')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('date_time')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('action')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedOrders.map(order => (
              <tr key={order.id}
                className="hover: bg-gray-50 transition-colors">
                {/* Customer */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="font-medium">{order.customer_name || 'N/A'}</div>
                  {order.customer_email && (
                    <div className="text-xs text-gray-500">{order.customer_email}</div>
                  )}
                </td>
                {/* Hole */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.hole_number ?? '-'}</td>
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
                {/* Status badge */}
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
                    {t(order.fulfillment_status)}
                  </span>
                </td>
                {/* Date/Time */}
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                </td>
                {/* Action column */}
                <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex flex-col items-start gap-2 w-48 min-w-48"> {/* Adjust width as needed */}
    {editingOrderId === order.id ? (
      <>
        <select
          value={editStatusTemp ?? order.fulfillment_status}
          onChange={e => setEditStatusTemp(e.target.value as Order['fulfillment_status'])}
          className="appearance-none px-3 py-2 border-2 border-green-500 bg-green-50 font-semibold rounded-lg text-sm focus:ring-2 focus:ring-green-400 shadow mb-2 w-full"
        >
          <option value="new">{t('new')}</option>
          <option value="preparing">{t('preparing')}</option>
          <option value="on_the_way">{t('on_the_way')}</option>
          <option value="delivered">{t('delivered')}</option>
          <option value="cancelled">{t('cancelled')}</option>
        </select>
        <div className="flex gap-2 w-full">
          <button
            className="flex-1 px-4 py-2 rounded bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition"
            onClick={() => {
              setEditingOrderId(null);
              setEditStatusTemp(null);
            }}
          >
            {t('cancel')}
          </button>
          <button
            className="flex-1 px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            onClick={() => {
              if (editStatusTemp && editStatusTemp !== order.fulfillment_status) {
                onStatusChange(order.id, editStatusTemp);
              }
              setEditingOrderId(null);
              setEditStatusTemp(null);
            }}
          >
            {t('save')}
          </button>
        </div>
      </>
    ) : (
      <>
        <select
          value={order.fulfillment_status}
          disabled
          className="appearance-none px-3 py-2 border bg-gray-100 text-gray-700 font-semibold rounded-lg text-sm shadow mb-2 w-full"
        >
          <option value="new">{t('new')}</option>
          <option value="preparing">{t('preparing')}</option>
          <option value="on_the_way">{t('on_the_way')}</option>
          <option value="delivered">{t('delivered')}</option>
          <option value="cancelled">{t('cancelled')}</option>
        </select>
        <button
          className="w-full px-4 py-2 rounded bg-green-500 text-white font-semibold hover:bg-green-700 transition"
          onClick={() => {
            setEditingOrderId(order.id);
            setEditStatusTemp(order.fulfillment_status);
          }}
        >
          {t('edit')}
        </button>
      </>
    )}
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Mobile/Tablet Card View --- */}
      <div className="block lg:hidden space-y-3">
        {sortedOrders.length === 0 ? (
          <div className="flex justify-center items-center h-32 text-gray-500">
            {t('no_orders_found')}
          </div>
        ) : (
          sortedOrders.map(order => (
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
                          setEditStatusTemp(null);
                        }}
                      >
                        {t('cancel')}
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                        onClick={() => {
                          if (editStatusTemp && editStatusTemp !== order.fulfillment_status) {
                            onStatusChange?.(order.id, editStatusTemp);
                          }
                          setEditingOrderId(null);
                          setEditStatusTemp(null);
                        }}
                      >
                        {t('save')}
                      </button>
                    </>
                  ) : (
                    <button
                      className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                      onClick={() => {
                        setEditingOrderId(order.id);
                        setEditStatusTemp(order.fulfillment_status);
                      }}
                    >
                      {t('edit')}
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
                    {t(order.fulfillment_status)}
                  </span>
                </div>
              </div>
              {/* Rest of card */}
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
                    <option value="new">{t('new')}</option>
                    <option value="preparing">{t('preparing')}</option>
                    <option value="on_the_way">{t('on_the_way')}</option>
                    <option value="delivered">{t('delivered')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
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