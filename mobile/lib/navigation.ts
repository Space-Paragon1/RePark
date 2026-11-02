import { Platform } from 'react-native';

/**
 * Where "Report a car" goes: the Report tab on iOS; on Android, Report isn't a tab
 * (it's the floating button), so the flow opens full screen.
 */
export const REPORT_HREF = Platform.OS === 'android' ? '/new-report' : '/(tabs)/report';
