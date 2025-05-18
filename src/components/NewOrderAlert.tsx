import React, { useEffect } from 'react';

interface NewOrderAlertProps {
  holeNumber: number;
  customerName: string;
  onDismiss: () => void;
}

export default function NewOrderAlert({ holeNumber, customerName, onDismiss }: NewOrderAlertProps) {
  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3');
    audio.play().catch(err => console.warn('🔇 Audio playback blocked:', err));
  }, []);

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 bg-black bg-opacity-90 text-white flex items-center justify-center text-center p-6 cursor-pointer animate-bounce"
    >
      <div className="space-y-4 max-w-md mx-auto">
        <h1 className="text-5xl font-bold">🚨 New Order</h1>
        <p className="text-3xl">Hole #{holeNumber}</p>
        <p className="text-xl">{customerName} just placed an order.</p>
        <p className="text-sm opacity-70">Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}
