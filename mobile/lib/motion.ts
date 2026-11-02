// Motion helpers (handoff motion.md).
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** True when the person has asked the system to reduce motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { mounted = false; sub.remove(); };
  }, []);
  return reduced;
}
