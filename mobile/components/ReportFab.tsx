import { Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableScale } from '@/components/PressableScale';
import { Send } from '@/components/icons';
import { font, themedStyles, useTheme } from '@/lib/theme';

/**
 * Android only: Report is an extended FAB (56 high, radius 16, brand) bottom-right,
 * above the nav bar on Home, Vehicles and Alerts. It opens the report flow full screen.
 */
export function ReportFab() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  if (Platform.OS !== 'android') return null;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <PressableScale style={styles.fab} onPress={() => router.push('/new-report')} accessibilityLabel="Report a car">
        <Send size={20} color={colors.onBrand} />
        <Text style={styles.label}>Report</Text>
      </PressableScale>
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  wrap: { position: 'absolute', right: 16, bottom: 16 },
  fab: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: c.brand,
    elevation: 6,
  },
  label: { fontFamily: font.headingBold, fontSize: 16, color: c.onBrand },
}));
