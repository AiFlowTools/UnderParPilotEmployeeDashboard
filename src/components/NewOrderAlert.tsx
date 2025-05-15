import React, { useEffect } from 'react';

interface NewOrderAlertProps {
  holeNumber: number;
  onDismiss: () => void;
}

export default function NewOrderAlert({ holeNumber, onDismiss }: NewOrderAlertProps) {
  useEffect(() => {
    // Play notification sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {
      // Ignore errors - some browsers block autoplay
    });
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-green-500 flex items-center justify-center z-50 cursor-pointer animate-fadeIn"
      onClick={onDismiss}
    >
      <div className="text-center">
        <div className="text-[12rem] font-bold text-white mb-4">
          {holeNumber}
        </div>
        <div className="text-4xl font-bold text-white mb-2">
          New Order
        </div>
        <div className="text-xl text-white/80">
          Tap anywhere to accept
        </div>
      </div>
    </div>
  );
}