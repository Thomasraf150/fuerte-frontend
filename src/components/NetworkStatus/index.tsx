"use client";

import React, { useState, useEffect } from 'react';

interface NetworkStatusProps {
  className?: string;
  showOfflineMessage?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  className = '',
  showOfflineMessage = true 
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Show reconnected message briefly
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    // Listen for network status changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !wasOffline) {
    return null; // Don't show anything when online normally
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      {!isOnline ? (
        <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            {showOfflineMessage ? 'Connection lost' : 'Offline'}
          </span>
        </div>
      ) : wasOffline ? (
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-300 rounded-full"></div>
          <span className="text-sm font-medium">Reconnected</span>
        </div>
      ) : null}
    </div>
  );
};

export default NetworkStatus;