import React, { useState } from "react";
import { Bell, X } from "lucide-react";

interface NotificationBellProps {
  count: number;
  onNotificationClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  count,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown on outside click
  const handleBackdropClick = () => setIsOpen(false);

  // When bell is clicked
  const handleBellClick = () => {
    setIsOpen((open) => !open);
    if (onNotificationClick) onNotificationClick();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-white hover:bg-green-700 rounded-lg focus:ring-2 focus:ring-green-400"
        aria-label="Toggle notifications"
      >
        <Bell className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full shadow">
            {count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleBackdropClick}
            aria-label="Close notifications dropdown"
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
            <div className="px-4 py-3 text-center text-gray-500">
              {count === 0
                ? "No new notifications"
                : `You have ${count} new notification${count === 1 ? "" : "s"}.`}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
