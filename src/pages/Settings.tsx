import React, { useState, useEffect } from 'react';
import { LogOut, Volume2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';

export default function Settings() {
  const navigate = useNavigate();
  const { user, role, isAdmin } = useUser();
  const [session, setSession] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Load saved preferences
    const savedSoundEnabled = localStorage.getItem('soundEnabled');
    const savedVolume = localStorage.getItem('notificationVolume');
    
    if (savedSoundEnabled !== null) {
      setSoundEnabled(savedSoundEnabled === 'true');
    }
    if (savedVolume !== null) {
      setVolume(parseFloat(savedVolume));
    }
  }, []);

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

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('soundEnabled', enabled.toString());
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem('notificationVolume', newVolume.toString());
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Settings */}
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
              className="w-full px-3 py-2 md:py-3 border rounded-lg bg-gray-50 min-h-[44px]"
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
              className="w-full px-3 py-2 md:py-3 border rounded-lg bg-gray-50 min-h-[44px]"
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
                className="w-full px-3 py-2 md:py-3 border rounded-lg bg-green-50 text-green-800 min-h-[44px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center min-h-[44px]">
            <input 
              type="checkbox" 
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" 
            />
            <span className="ml-2">Email notifications for new orders</span>
          </label>
          
          <label className="flex items-center min-h-[44px]">
            <input 
              type="checkbox" 
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" 
            />
            <span className="ml-2">Push notifications for order updates</span>
          </label>
          
          <label className="flex items-center min-h-[44px]">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => handleSoundToggle(e.target.checked)}
              className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400"
            />
            <span className="ml-2">Enable sound for new orders</span>
          </label>
          
          {soundEnabled && (
            <div className="space-y-2 ml-6">
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
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-green-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">App Settings</h3>
        <div className="space-y-4">
          <label className="flex items-center min-h-[44px]">
            <input 
              type="checkbox" 
              className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" 
            />
            <span className="ml-2">Auto-refresh dashboard data</span>
          </label>
          
          <label className="flex items-center min-h-[44px]">
            <input 
              type="checkbox" 
              className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" 
            />
            <span className="ml-2">Show order completion animations</span>
          </label>
          
          <label className="flex items-center min-h-[44px]">
            <input 
              type="checkbox" 
              className="form-checkbox h-4 w-4 text-green-600 focus:ring-2 focus:ring-green-400" 
            />
            <span className="ml-2">Enable dark mode</span>
          </label>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">Data & Privacy</h3>
        <div className="space-y-4">
          <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-green-400 min-h-[44px]">
            Export my data
          </button>
          
          <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-green-400 min-h-[44px]">
            Clear cache and stored data
          </button>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Privacy Notice</p>
                <p>Your data is stored securely and only used for order management purposes. We do not share your information with third parties.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="px-4 md:px-6 py-2 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-400 min-h-[44px] flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
          
          <p className="text-sm text-gray-500">
            Signing out will clear all local data and return you to the login screen.
          </p>
        </div>
      </div>
    </div>
  );
}