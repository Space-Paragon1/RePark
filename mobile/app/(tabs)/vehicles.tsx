import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, vehiclesApi, type PlateClaim, type Vehicle } from '@/lib/api';
import { claimStatus, formatDate } from '@/lib/labels';
import { isPlateValid, plateForSubmit } from '@/lib/plate';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { FadeInView } from '@/components/FadeInView';
import { Plate, PlateInput } from '@/components/Plate';
import { ReportFab } from '@/components/ReportFab';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState, ListError } from '@/components/States';
import { useToast } from '@/components/Toast';
import { Car, MapPin, Plus, Trash2, X } from '@/components/icons';

const MAX_VEHICLES = 10;
const COLOURS = ['Black', 'White', 'Silver', 'Grey', 'Blue', 'Red', 'Green'];

/** Vehicles (screens.md): your cars (up to 10), adding one, ownership claims, removing. */
export default function VehiclesScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [claims, setClaims] = useState<PlateClaim[]>([]);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  // The vehicle waiting on the "Remove?" sheet.
  const [removing, setRemoving] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, claimList] = await Promise.all([vehiclesApi.list(), vehiclesApi.listClaims().catch(() => [])]);
      setVehicles(list);
      setClaims(claimList);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (vehicle: Vehicle) => {
    setDeleting(true);
    setRemoveError(null);
    try {
      await vehiclesApi.delete(vehicle.id);
      setVehicles(prev => prev?.filter(v => v.id !== vehicle.id) ?? null);
      setRemoving(null);
    } catch (e: any) {
      setRemoveError(e.message ?? "Something went wrong on our side. Try again.");
      setRemoving(null);
    } finally {
      setDeleting(false);
    }
  };

  const atLimit = (vehicles?.length ?? 0) >= MAX_VEHICLES;

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.brand} />}
      >
        <View style={s.header}>
          <View style={s.flex}>
            <Text style={s.largeTitle} accessibilityRole="header">Vehicles</Text>
            {vehicles && <Text style={s.count}>{vehicles.length} of {MAX_VEHICLES}</Text>}
          </View>
          {!!vehicles?.length && (
            <Button label="Add" icon={Plus} size="compact" disabled={atLimit} onPress={() => setAdding(true)} />
          )}
        </View>

        {atLimit && (
          <Banner
            tone="notice"
            message="You've added 10 vehicles, the most one account can have. Remove one to add another."
            style={s.banner}
          />
        )}
        {!!removeError && <Banner tone="error" message={removeError} style={s.banner} />}
        {vehicles === null && !error && (<><SkeletonCard /><SkeletonCard /></>)}
        {error && vehicles === null && <ListError list="vehicles" onRetry={load} />}

        {vehicles?.length === 0 && (
          <EmptyState
            icon={Car}
            title="No vehicles"
            body="Add your plate so people can reach you without knowing who you are."
            actionLabel="Add a vehicle"
            actionIcon={Plus}
            onAction={() => setAdding(true)}
          />
        )}

        {vehicles?.map((vehicle, index) => (
          <FadeInView key={vehicle.id} delay={index * 60}>
            <View style={s.card}>
              <View style={s.cardTop}>
                <Plate plate={vehicle.plate_number} size="M" />
                <Pressable
                  onPress={() => setRemoving(vehicle)}
                  style={s.removeButton}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${vehicle.plate_number}`}
                >
                  <Trash2 size={20} color={colors.textMuted} />
                </Pressable>
              </View>
              <Text style={s.vehicleName}>{vehicle.color} {vehicle.make} {vehicle.model}</Text>
              {vehicle.parking_zone ? (
                <View style={s.zoneRow}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={s.zoneText}>Usually {vehicle.parking_zone}</Text>
                </View>
              ) : null}
              <Text style={s.added}>Added {formatDate(vehicle.created_at)}</Text>
            </View>
          </FadeInView>
        ))}

        {claims.length > 0 && (
          <View style={s.section}>
            <Text style={s.kicker}>Ownership claims</Text>
            <View style={s.listCard}>
              {claims.map((claim, i) => (
                <View key={claim.id} style={[s.claimRow, i > 0 && s.divider]}>
                  <Plate plate={claim.plate_number} />
                  <Text style={s.filed}>Filed {formatDate(claim.created_at)}</Text>
                  <Chip status={claimStatus(claim)} dense />
                </View>
              ))}
            </View>
            {claims.some(c => c.status === 'pending') && (
              <Text style={s.claimNote}>We're checking this claim. The status updates here.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <AddVehicleSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onAdded={vehicle => {
          setVehicles(prev => [...(prev ?? []), vehicle]);
          setAdding(false);
        }}
        onClaimed={plate => {
          setAdding(false);
          load();
          toast(`Claim filed for ${plate}. We'll let you know.`);
        }}
      />

      <ConfirmSheet
        visible={!!removing}
        icon={Trash2}
        title={`Remove ${removing?.plate_number ?? ''}?`}
        body="You'll stop getting alerts for this car. People who report it will be told the owner isn't on RePark."
        confirmLabel="Remove vehicle"
        confirmingLabel="Removing"
        cancelLabel="Keep it"
        busy={deleting}
        onConfirm={() => removing && remove(removing)}
        onCancel={() => setRemoving(null)}
      />
      <ReportFab />
    </View>
  );
}

/** Add a vehicle: plate, make, model, colour chips, and where it's usually parked (optional). */
function AddVehicleSheet({ visible, onClose, onAdded, onClaimed }: {
  visible: boolean;
  onClose: () => void;
  onAdded: (vehicle: Vehicle) => void;
  onClaimed: (plate: string) => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [colour, setColour] = useState('');
  const [otherColour, setOtherColour] = useState(false);
  const [zone, setZone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when the plate belongs to another account; offers a claim instead.
  const [plateTaken, setPlateTaken] = useState(false);

  const reset = () => {
    setPlate(''); setMake(''); setModel(''); setColour(''); setOtherColour(false); setZone('');
    setError(null); setPlateTaken(false);
  };

  const close = () => { reset(); onClose(); };

  const details = () => ({
    plate_number: plateForSubmit(plate),
    make: make.trim(),
    model: model.trim(),
    color: colour.trim(),
  });

  const add = async () => {
    if (!isPlateValid(plate)) return setError('Enter the plate: 2 to 10 letters and numbers.');
    if (!make.trim() || !model.trim() || !colour.trim()) return setError('Add the make, model and colour.');
    setSaving(true);
    setError(null);
    try {
      const vehicle = await vehiclesApi.create({ ...details(), parking_zone: zone.trim() || null });
      reset();
      onAdded(vehicle);
    } catch (e: any) {
      if (e instanceof ApiError && e.code === 'plate_taken') setPlateTaken(true);
      else setError(e.message ?? 'Something went wrong on our side. Your details are still here. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const fileClaim = async () => {
    setSaving(true);
    setError(null);
    try {
      await vehiclesApi.createClaim(details());
      const claimed = plateForSubmit(plate);
      reset();
      onClaimed(claimed);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong on our side. Your details are still here. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <KeyboardAvoidingView style={s.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.sheetHeader, Platform.OS === 'android' && { paddingTop: insets.top + 12 }]}>
          <Text style={s.sheetTitle} accessibilityRole="header">Add a vehicle</Text>
          <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cancel">
            <X size={24} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={s.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={s.label}>Plate</Text>
          <PlateInput value={plate} onChangeText={value => { setPlate(value); setPlateTaken(false); }} />

          {plateTaken && (
            <View style={s.taken}>
              <Text style={s.takenTitle}>This plate is already registered to another account.</Text>
              <Text style={s.takenBody}>
                If it's your car, you can file an ownership claim. We review it and let you know. The other account isn't
                told who you are.
              </Text>
              <Button
                label={`File a claim for ${plateForSubmit(plate)}`}
                onPress={fileClaim}
                loading={saving}
                loadingLabel="Filing"
                style={s.takenButton}
              />
            </View>
          )}

          <Text style={s.label}>Make</Text>
          <TextInput style={s.input} value={make} onChangeText={setMake} placeholder="Toyota" placeholderTextColor={colors.textMuted} autoCapitalize="words" />
          <Text style={s.label}>Model</Text>
          <TextInput style={s.input} value={model} onChangeText={setModel} placeholder="Corolla" placeholderTextColor={colors.textMuted} autoCapitalize="words" />

          <Text style={s.label}>Colour</Text>
          <View style={s.chips}>
            {COLOURS.map(name => {
              const selected = !otherColour && colour === name;
              return (
                <Pressable
                  key={name}
                  onPress={() => { setOtherColour(false); setColour(name); }}
                  style={[s.colourChip, selected && s.colourChipOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                >
                  <Text style={[s.colourText, selected && s.colourTextOn]}>{name}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => { setOtherColour(true); setColour(''); }}
              style={[s.colourChip, otherColour && s.colourChipOn]}
              accessibilityRole="radio"
              accessibilityState={{ checked: otherColour }}
            >
              <Text style={[s.colourText, otherColour && s.colourTextOn]}>Other</Text>
            </Pressable>
          </View>
          {otherColour && (
            <TextInput
              style={[s.input, s.otherColour]}
              value={colour}
              onChangeText={setColour}
              placeholder="Colour"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoFocus
            />
          )}

          <Text style={s.label}>Usually parked <Text style={s.optional}>optional</Text></Text>
          <TextInput style={s.input} value={zone} onChangeText={setZone} placeholder="Elm Street" placeholderTextColor={colors.textMuted} />
          <Text style={s.hint}>Only for you, to tell your cars apart.</Text>

          {!!error && <Banner tone="error" message={error} style={s.banner} />}
        </ScrollView>
        {!plateTaken && (
          <View style={[s.sheetActions, { paddingBottom: insets.bottom + 12 }]}>
            <Button label="Add" size="main" onPress={add} loading={saving} loadingLabel="Adding" />
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = themedStyles((c) => ({
  root: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 96 },
  header: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  largeTitle: { fontFamily: font.heading, fontSize: 34, lineHeight: 40, letterSpacing: -0.7, color: c.text },
  count: { fontFamily: font.monoMedium, fontSize: 13, color: c.textMuted, marginTop: 2 },
  banner: { marginBottom: 12 },
  card: {
    backgroundColor: c.surface, borderRadius: radius.card, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: c.line,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  removeButton: { padding: 6 },
  vehicleName: { fontSize: 17, fontWeight: '600', color: c.text, marginTop: 14 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  zoneText: { fontSize: 14, color: c.textSecondary },
  added: { fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted, marginTop: 10 },
  section: { marginTop: 24 },
  kicker: { fontFamily: font.mono, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: c.textMuted, marginBottom: 10 },
  listCard: { borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: 'hidden' },
  claimRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  divider: { borderTopWidth: 1, borderTopColor: c.line },
  filed: { flex: 1, fontFamily: font.monoMedium, fontSize: 12, color: c.textMuted },
  claimNote: { fontSize: 13, color: c.textSecondary, marginTop: 8 },

  sheet: { flex: 1, backgroundColor: c.surface },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  sheetTitle: { fontFamily: font.heading, fontSize: 24, color: c.text },
  sheetContent: { padding: 20, paddingTop: 8, paddingBottom: 24 },
  sheetActions: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line },
  label: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 18, marginBottom: 8 },
  optional: { fontWeight: '400', color: c.textMuted },
  input: {
    height: 48, borderWidth: 1.5, borderColor: c.lineStrong, borderRadius: radius.control,
    paddingHorizontal: 14, fontSize: 16, color: c.text, backgroundColor: c.surface,
  },
  otherColour: { marginTop: 10 },
  hint: { fontSize: 13, color: c.textMuted, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colourChip: {
    height: 36, paddingHorizontal: 14, justifyContent: 'center',
    borderRadius: 999, borderWidth: 1.5, borderColor: c.lineStrong,
  },
  colourChipOn: { borderColor: c.brand, backgroundColor: c.brandTint },
  colourText: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
  colourTextOn: { color: c.brand },
  taken: { marginTop: 12, padding: 14, borderRadius: radius.control, backgroundColor: c.signalTint },
  takenTitle: { fontSize: 15, fontWeight: '700', color: c.text },
  takenBody: { fontSize: 14, lineHeight: 20, color: c.textSecondary, marginTop: 4 },
  takenButton: { marginTop: 12 },
}));
