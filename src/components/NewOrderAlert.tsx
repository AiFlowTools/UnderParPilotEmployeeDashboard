import React, { useEffect } from 'react';

interface NewOrderAlertProps {
  holeNumber: number;
  customerName: string;
  onDismiss: () => void;
}

export default function NewOrderAlert({ holeNumber, customerName, onDismiss }: NewOrderAlertProps) {
  useEffect(() => {
    const soundEnabled = localStorage.getItem('soundEnabled') === 'true';
    const volume = parseFloat(localStorage.getItem('notificationVolume') || '0.8');

    if (soundEnabled) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = volume;
      audio.play().catch(() => {}); // suppress autoplay errors
    }
  }, []);

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 bg-black bg-opacity-90 text-white flex items-center justify-center text-center p-6 cursor-pointer"
    >
      <div className="space-y-4 max-w-md mx-auto">
        <h1 className="text-5xl font-bold">🚨 New Order</h1>
        <p className="text-3xl">Hole #{holeNumber}</p>
        <p className="text-xl">{customerName || 'Someone'} just placed an order.</p>
        <p className="text-sm opacity-70">Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}
