import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeStatusProps {
  className?: string;
}

const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);

  useEffect(() => {
    // Monitor connection status by checking supabase realtime connection
    const checkConnection = () => {
      const channels = supabase.getChannels();
      const hasActiveChannels = channels.length > 0;
      const allConnected = channels.every(
        channel => channel.state === 'joined' || channel.state === 'joining'
      );

      setIsConnected(hasActiveChannels && allConnected);

      if (!allConnected && hasActiveChannels) {
        setConnectionAttempts(prev => prev + 1);
      } else {
        setConnectionAttempts(0);
      }
    };

    // Check initially
    checkConnection();

    // Poll connection status every 3 seconds
    const interval = setInterval(checkConnection, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Auto-reconnect if disconnected
  useEffect(() => {
    if (!isConnected && connectionAttempts > 3) {
      console.log('[Real-time] Attempting to reconnect...');

      // Trigger reconnection by removing and re-subscribing to channels
      const channels = supabase.getChannels();
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });

      // Reset attempt counter
      setConnectionAttempts(0);
    }
  }, [isConnected, connectionAttempts]);

  return (
    <Badge
      variant={isConnected ? 'default' : 'destructive'}
      className={`flex items-center gap-1.5 ${className}`}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span className="text-xs">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 animate-pulse" />
          <span className="text-xs">Reconnecting...</span>
        </>
      )}
    </Badge>
  );
};

export default RealtimeStatus;
