import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { ApiError, Vehicle, VehicleCreate, vehiclesApi } from '@/lib/api';
import { font, radius, themedStyles, useTheme } from '@/lib/theme';
import { PressableScale } from '@/components/PressableScale';
import { FadeInView } from '@/components/FadeInView';
import { SkeletonCard } from '@/components/Skeleton';

// ─── Add Vehicle Modal ────────────────────────────────────────────────────────

function AddVehicleModal({ visible, onClose, onAdded }: {
  visible: boolean; onClose: () => void; onAdded: (v: Vehicle) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [form, setForm] = useState<VehicleCreate>({
    plate_number: '', make: '', model: '', color: '', parking_zone: null,
  });
  const [saving, setSaving] = useState(false);

  const set = (field: keyof VehicleCreate) => (value: string) =>
    setForm(f => ({ ...f, [field]: value || null }));

  const handleSave = async () => {
    if (!form.plate_number || !form.make || !form.model || !form.color) {
      Alert.alert('Missing fields', 'Plate, make, model and colour are required.');
      return;
    }
    setSaving(true);
    try {
      const vehicle = await vehiclesApi.create(form);
      onAdded(vehicle);
      setForm({ plate_number: '', make: '', model: '', color: '', parking_zone: null });
    } catch (e: any) {
      if (e instanceof ApiError && e.code === 'plate_taken') {
        Alert.alert('Plate already registered', e.message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'File a claim', onPress: fileClaim },
        ]);
      } else {
        Alert.alert('Error', e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const fileClaim = async () => {
    try {
      await vehiclesApi.createClaim({
        plate_number: form.plate_number,
        make: form.make,
        model: form.model,
        color: form.color,
      });
      Alert.alert(
        'Claim submitted',
        "We'll review your claim. If it's approved, the plate will move to your account.",
      );
      setForm({ plate_number: '', make: '', model: '', color: '', parking_zone: null });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const FIELDS = [
    { field: 'plate_number' as const, label: 'Plate Number', placeholder: 'ABC 123', caps: true, required: true },
    { field: 'make'         as const, label: 'Make',         placeholder: 'Toyota',           required: true },
    { field: 'model'        as const, label: 'Model',        placeholder: 'Camry',            required: true },
    { field: 'color'        as const, label: 'Colour',       placeholder: 'Silver',           required: true },
    { field: 'parking_zone' as const, label: 'Parking Zone', placeholder: 'Zone A (optional)', required: false },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalDrag} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Register Vehicle</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>

          {FIELDS.map(({ field, label, placeholder, caps, required }) => (
            <View key={field} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {label} {required && <Text style={styles.required}>*</Text>}
              </Text>
              <TextInput
                style={styles.fieldInput}
                value={form[field] ?? ''}
                onChangeText={set(field)}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                autoCapitalize={caps ? 'characters' : 'words'}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={colors.onBrand} />
              : <Text style={styles.saveButtonText}>Save Vehicle</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

function VehicleCard({ vehicle, onDelete }: { vehicle: Vehicle; onDelete: () => void }) {
  const styles = useStyles();
  const initials = `${vehicle.make[0] ?? ''}${vehicle.model[0] ?? ''}`.toUpperCase();

  const confirmDelete = () =>
    Alert.alert('Remove vehicle', `Remove ${vehicle.plate_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onDelete },
    ]);

  return (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>{initials}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.plate}>{vehicle.plate_number}</Text>
        <Text style={styles.vehicleDesc}>{vehicle.color} {vehicle.make} {vehicle.model}</Text>
        {vehicle.parking_zone
          ? <View style={styles.zonePill}><Text style={styles.zoneText}>Zone {vehicle.parking_zone}</Text></View>
          : null}
      </View>
      <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VehiclesScreen() {
  const styles = useStyles();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadVehicles = useCallback(async () => {
    try { setVehicles(await vehiclesApi.list()); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const handleAdded = (v: Vehicle) => { setVehicles(prev => [v, ...prev]); setShowAdd(false); };
  const handleDelete = async (id: string) => {
    try { await vehiclesApi.delete(id); setVehicles(prev => prev.filter(v => v.id !== id)); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Registered</Text>
          <Text style={styles.headerTitle}>My Vehicles</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={v => v.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptySub}>Register your plate to receive anonymous alerts when reported.</Text>
              <PressableScale onPress={() => setShowAdd(true)} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Register a Vehicle</Text>
              </PressableScale>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 60}>
              <VehicleCard vehicle={item} onDelete={() => handleDelete(item.id)} />
            </FadeInView>
          )}
        />
      )}

      <AddVehicleModal visible={showAdd} onClose={() => setShowAdd(false)} onAdded={handleAdded} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = themedStyles((c) => ({
  container: { flex: 1, backgroundColor: c.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 18,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  headerLabel: { fontSize: 12, color: c.textMuted, fontFamily: font.mono, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontFamily: font.heading, color: c.text, marginTop: 2 },
  addBtn: { backgroundColor: c.brand, paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.pill },
  addBtnText: { color: c.onBrand, fontWeight: '700', fontSize: 14 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.card,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.line,
  },
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: c.brand },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: c.brandTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 14,
  },
  cardAvatarText: { fontSize: 14, fontWeight: '800', color: c.brand },
  cardBody: { flex: 1, paddingVertical: 14 },
  plate: { fontSize: 18, fontFamily: font.mono, color: c.text, letterSpacing: 1 },
  vehicleDesc: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  zonePill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: c.brandTint,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  zoneText: { fontSize: 11, color: c.brand, fontWeight: '600' },
  deleteBtn: { padding: 16 },
  deleteText: { color: c.textMuted, fontSize: 16, fontWeight: '600' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: font.headingBold, color: c.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyBtn: { backgroundColor: c.brand, borderRadius: radius.control, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: c.onBrand, fontWeight: '700', fontSize: 15 },

  // Modal
  modalRoot: { flex: 1, backgroundColor: c.surface },
  modalContent: { padding: 24, paddingBottom: 48 },
  modalHeader: { marginBottom: 24 },
  modalDrag: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.line, alignSelf: 'center', marginBottom: 20 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontFamily: font.heading, color: c.text },
  modalClose: { fontSize: 16, color: c.brand, fontWeight: '600' },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 6 },
  required: { color: c.stop },
  fieldInput: {
    borderWidth: 1.5, borderColor: c.lineStrong, borderRadius: radius.control,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: c.text, backgroundColor: c.bg,
  },
  saveButton: { backgroundColor: c.brand, borderRadius: radius.control, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: c.onBrand, fontSize: 16, fontWeight: '700' },
}));
