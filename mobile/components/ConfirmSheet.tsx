import { useEffect } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import type { LucideIcon } from '@/components/icons';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';

/**
 * Replaces confirmation alerts. A bottom sheet over a 55% scrim: grabber, 48 px tinted
 * icon disc, title, body, then the destructive action above a secondary "Keep …".
 * Tapping the scrim or the back button chooses the safe action.
 */
export function ConfirmSheet({
  visible,
  icon: Icon,
  title,
  body,
  confirmLabel,
  confirmingLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
  confirmDisabled = false,
  warn = false,
  children,
}: {
  visible: boolean;
  icon: LucideIcon;
  title: string;
  body: string;
  confirmLabel: string;
  confirmingLabel?: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  confirmDisabled?: boolean;
  /** Warning haptic when it opens (the Incorrect report sheet). */
  warn?: boolean;
  /** Extra content between the body and the buttons, such as a "type DELETE" field. */
  children?: React.ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && warn) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  }, [visible, warn]);

  const cancel = () => {
    if (!busy) onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={cancel}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={cancel} accessibilityLabel={cancelLabel} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <View style={styles.iconDisc}>
            <Icon size={24} color={colors.stop} />
          </View>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          <Text style={styles.body}>{body}</Text>
          {children}
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              variant="destructive"
              size="main"
              onPress={onConfirm}
              loading={busy}
              loadingLabel={confirmingLabel}
              disabled={confirmDisabled}
            />
            <Button label={cancelLabel} variant="secondary" size="main" onPress={cancel} disabled={busy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ios = Platform.OS === 'ios';

const useStyles = themedStyles((c, sh) => ({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: c.surface,
    // iOS sheets use the 22 token; Android M3 sheets use 28.
    borderTopLeftRadius: ios ? radius.sheet : 28,
    borderTopRightRadius: ios ? radius.sheet : 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...sh.e2,
  },
  grabber: {
    alignSelf: 'center',
    width: ios ? 36 : 32,
    height: ios ? 5 : 4,
    borderRadius: 3,
    backgroundColor: c.lineStrong,
    marginBottom: 20,
  },
  iconDisc: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: c.stopTint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontFamily: font.heading, fontSize: 23, lineHeight: 28, color: c.text, letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 23, color: c.textSecondary, marginTop: 8, marginBottom: 4 },
  actions: { gap: 10, marginTop: 20 },
}));
