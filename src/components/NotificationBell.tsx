import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  order_id: string;
}

interface NotificationBellProps {
  count?: number;
  onNotificationClick?: () => void;
}

export default function NotificationBell({ count = 0, onNotificationClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications' 
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
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

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    if (notifications.length === 1) {
      setIsOpen(false);
    }

    // Call the onNotificationClick callback when a notification is clicked
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  return (
    // 1) A relative wrapper
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
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

      {open && (
        // 2) Dropdown positioned immediately below the button
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl z-50">
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <span className="font-medium text-gray-700">Notifications</span>
            <button onClick={() => setOpen(false)} aria-label="Close" className="p-1">
              <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((n, i) => (
              <div key={i} className="px-4 py-3 border-b last:border-b-0">
                {n.message}
                <div className="text-xs text-gray-400 mt-1">{n.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}