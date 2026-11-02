// Lucide icons used in the app (handoff: Lucide everywhere, 2 px stroke).
// Each is imported from its own file so only these end up in the bundle;
// Metro doesn't drop unused exports from the package's main entry.
import { Platform } from 'react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';

export type { LucideIcon, LucideProps } from 'lucide-react-native';

export { default as Ban } from 'lucide-react-native/icons/ban';
export { default as Bell } from 'lucide-react-native/icons/bell';
export { default as Car } from 'lucide-react-native/icons/car';
export { default as Check } from 'lucide-react-native/icons/check';
export { default as CheckCheck } from 'lucide-react-native/icons/check-check';
export { default as ChevronDown } from 'lucide-react-native/icons/chevron-down';
export { default as ChevronRight } from 'lucide-react-native/icons/chevron-right';
export { default as CircleAlert } from 'lucide-react-native/icons/circle-alert';
export { default as CircleCheck } from 'lucide-react-native/icons/circle-check';
export { default as Clock } from 'lucide-react-native/icons/clock';
export { default as Construction } from 'lucide-react-native/icons/construction';
export { default as Download } from 'lucide-react-native/icons/download';
export { default as EyeOff } from 'lucide-react-native/icons/eye-off';
export { default as FileText } from 'lucide-react-native/icons/file-text';
export { default as Flag } from 'lucide-react-native/icons/flag';
export { default as Hourglass } from 'lucide-react-native/icons/hourglass';
export { default as House } from 'lucide-react-native/icons/house';
export { default as Info } from 'lucide-react-native/icons/info';
export { default as LocateFixed } from 'lucide-react-native/icons/locate-fixed';
export { default as LogOut } from 'lucide-react-native/icons/log-out';
export { default as MapPin } from 'lucide-react-native/icons/map-pin';
export { default as MessageSquare } from 'lucide-react-native/icons/message-square';
export { default as Plus } from 'lucide-react-native/icons/plus';
export { default as RefreshCw } from 'lucide-react-native/icons/refresh-cw';
export { default as Send } from 'lucide-react-native/icons/send';
export { default as ShieldCheck } from 'lucide-react-native/icons/shield-check';
export { default as Siren } from 'lucide-react-native/icons/siren';
// Lucide 1.x merged trash-2 into trash; Trash2 is an alias for it.
export { default as Trash2 } from 'lucide-react-native/icons/trash';
export { default as TriangleAlert } from 'lucide-react-native/icons/triangle-alert';
export { default as User } from 'lucide-react-native/icons/user';
export { default as UserX } from 'lucide-react-native/icons/user-x';
export { default as X } from 'lucide-react-native/icons/x';
export { ArrowLeft, ChevronLeft };

/** Back arrow: chevron on iOS, arrow on Android (handoff icon table). */
export const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;
