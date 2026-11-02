import { Linking, Text, View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import { Button } from '@/components/Button';
import { CircleAlert, LocateFixed, RefreshCw } from '@/components/icons';
import type { CurrentLocation } from '@/lib/location';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';

/**
 * Location confirmation (components.md): a map-tile placeholder with the accuracy circle,
 * then "Near 142 Elm Street", "Accurate to 12 m · not shared" and Refresh.
 * The location is only used to check the reporter is nearby; it's never shown to the owner.
 */
export function LocationBlock({ location, onRefresh }: { location: CurrentLocation; onRefresh: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();

  if (location.status === 'denied' || location.status === 'error') {
    const denied = location.status === 'denied';
    return (
      <View style={[styles.card, styles.problem]}>
        <View style={styles.problemRow}>
          <CircleAlert size={18} color={colors.stop} />
          <Text style={styles.problemText}>
            {denied
              ? 'We need your location to send a report. Turn it on in Settings, then come back.'
              : "We couldn't find your location. Check that location services are on, then try again."}
          </Text>
        </View>
        <View style={styles.problemActions}>
          {denied && <Button label="Open Settings" variant="secondary" size="compact" onPress={() => Linking.openSettings()} />}
          <Button label="Try again" variant="quiet" size="compact" icon={RefreshCw} onPress={onRefresh} />
        </View>
      </View>
    );
  }

  const ready = location.status === 'ready';
  const accuracy = ready && location.accuracy ? Math.round(location.accuracy) : null;

  return (
    <View style={styles.card}>
      <MapTile active={ready} />
      <View style={styles.row}>
        <LocateFixed size={20} color={colors.brand} />
        <View style={styles.rowText}>
          <Text style={styles.place} numberOfLines={1}>
            {ready ? (location.place ? `Near ${location.place}` : 'Near your current location') : 'Finding your location'}
          </Text>
          <Text style={styles.accuracy}>
            {ready ? `${accuracy ? `Accurate to ${accuracy} m` : 'Location found'} · not shared` : "Only used to check you're nearby"}
          </Text>
        </View>
        <Button
          label="Refresh"
          variant="quiet"
          size="compact"
          loading={location.status === 'locating'}
          loadingLabel="Locating"
          onPress={onRefresh}
        />
      </View>
    </View>
  );
}

/** Placeholder map: a light street grid with the accuracy circle and a brand dot. */
function MapTile({ active }: { active: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.tile}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="grid" width={28} height={28} patternUnits="userSpaceOnUse">
            <Path d="M 28 0 L 0 0 0 28" fill="none" stroke={colors.line} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={colors.surfaceSunken} />
        <Rect width="100%" height="100%" fill="url(#grid)" />
        {active && (
          <>
            <Circle cx="50%" cy="50%" r={30} fill={colors.brandTint} stroke={colors.brand} strokeOpacity={0.35} strokeWidth={1.5} />
            <Circle cx="50%" cy="50%" r={7} fill={colors.brand} stroke={colors.surface} strokeWidth={2.5} />
          </>
        )}
      </Svg>
    </View>
  );
}

const useStyles = themedStyles((c) => ({
  card: { borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: 'hidden' },
  tile: { height: 96 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14, paddingRight: 4, paddingVertical: 10 },
  rowText: { flex: 1 },
  place: { fontSize: 16, fontWeight: '700', color: c.text },
  accuracy: { fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted, marginTop: 2 },
  problem: { padding: 14, borderColor: c.stop, backgroundColor: c.stopTint },
  problemRow: { flexDirection: 'row', gap: 10 },
  problemText: { flex: 1, fontSize: 15, lineHeight: 21, color: c.text },
  problemActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
}));
