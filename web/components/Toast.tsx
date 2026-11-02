'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

const ToastContext = createContext<(message: string) => void>(() => {});

/** Show a short confirmation, e.g. useToast()("Reply sent. We've let them know."). */
export function useToast() {
  return useContext(ToastContext);
}

/** Inverse pill with a check disc, radius 12, above the phone tab bar, for 4 seconds. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const show = useCallback((text: string) => {
    timers.current.forEach(clearTimeout);
    setMessage(text);
    setVisible(true);
    timers.current = [
      setTimeout(() => setVisible(false), 4000),
      setTimeout(() => setMessage(null), 4200), // after the 180 ms fade
    ];
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 flex justify-center sm:bottom-8"
      >
        {message && (
          <div
            className={`flex max-w-md items-center gap-2.5 rounded-xl bg-inverse px-4 py-3 text-[15px] font-semibold text-on-inverse shadow-e1 transition-[opacity,transform] ease-ui ${
              visible ? 'translate-y-0 opacity-100 duration-200' : 'translate-y-2 opacity-0 duration-150'
            }`}
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-go-on-inverse text-inverse">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
