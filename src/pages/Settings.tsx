// src/pages/Settings.tsx
import React from 'react';
import { Volume2 } from 'lucide-react';

export default function Settings({ session, role, isAdmin, soundEnabled, setSoundEnabled, volume, setVolume, handleLogout }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full px-3 py-2 md:py-3 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={role === 'admin' ? 'Administrator' : 'Employee'}
              disabled
              className="w-full px-3 py-2 md:py-3 border rounded-lg bg-gray-50"
            />
          </div>
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Status
              </label>
              <input
                type="text"
                value="Administrator"
                disabled
                className="w-full px-3 py-2 md:py-3 border rounded-lg bg-green-50 text-green-800"
              />
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center min-h-[44px]">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" />
            <span className="ml-2">Email notifications for new orders</span>
          </label>
          <label className="flex items-center min-h-[44px]">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" />
            <span className="ml-2">Push notifications for order updates</span>
          </label>
          <label className="flex items-center min-h-[44px]">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400"
            />
            <span className="ml-2">Enable sound for new orders</span>
          </label>
          {soundEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600 flex items-center">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Notification volume
                </label>
                <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-green-400"
              />
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <button
          onClick={handleLogout}
          className="px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-400 min-h-[44px]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
