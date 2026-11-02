import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from '@/components/icons';
import { motion, themedStyles, useTheme } from '@/lib/theme';

const ToastContext = createContext<(message: string) => void>(() => {});

/** Show a short confirmation, e.g. useToast()("Reply sent. We've let them know."). */
export function useToast() {
  return useContext(ToastContext);
}

const VISIBLE_MS = 4000;

/**
 * iOS: inverse pill with a check disc, radius 12. Android: a 48 high snackbar, radius 6.
 * Sits above the tab bar for 4 seconds; fades in 220 ms and out 180 ms.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMessage(null));
  }, [opacity]);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
    Animated.timing(opacity, { toValue: 1, duration: motion.uiMs, useNativeDriver: true }).start();
    timer.current = setTimeout(hide, VISIBLE_MS);
  }, [hide, opacity]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message && (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            {
              bottom: insets.bottom + 64,
              opacity,
              transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            },
          ]}
        >
          {Platform.OS === 'ios' && (
            <View style={styles.disc}>
              <Check size={13} strokeWidth={3} color={colors.inverse} />
            </View>
          )}
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const ios = Platform.OS === 'ios';

const useStyles = themedStyles((c, sh) => ({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: ios ? 12 : 6,
    backgroundColor: c.inverse,
    ...sh.e1,
  },
  disc: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: c.goOnInverse,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1, color: c.onInverse, fontSize: 15, fontWeight: '600' },
}));
