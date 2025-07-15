import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NotificationBellProps {
  onNotificationClick?: () => void;
  // ...rest of props
}

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  order_id: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch initial unread notifications and subscribe to new ones
  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (!newNotif.read) {
            setNotifications((prev) => [newNotif, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    setNotifications(data || []);
  };

  const handleClick = async (notif: Notification) => {
    // Mark it read in the database
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notif.id);
   
    // Call parent handler to switch tabs, if provided
  if (onNotificationClick) {
    onNotificationClick();
  }

    // Remove it from UI list
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));

    // Close dropdown if that was the last one
    if (notifications.length <= 1) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 text-white hover:bg-green-700 rounded-lg focus:ring-2 focus:ring-green-400"
        aria-label="Toggle notifications"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl z-50">
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <span className="font-medium text-gray-700">Notifications</span>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="p-1"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm text-gray-900">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </button>
              ))}
              {notifications.length === 0 && (
                <div className="px-4 py-3 text-center text-gray-500">
                  No new notifications
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default NotificationBell;
