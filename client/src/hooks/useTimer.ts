import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

export function useTimer() {
  const timer = useGameStore(s => s.timer);
  const setTimer = useGameStore(s => s.setTimer);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (timer > 0) {
      intervalRef.current = setInterval(() => {
        const current = useGameStore.getState().timer;
        if (current <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimer(0);
        } else {
          setTimer(current - 1);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer > 0]);

  return timer;
}
