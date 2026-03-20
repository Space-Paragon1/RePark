import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Vehicle, VehicleCreate, vehiclesApi } from '@/lib/api';
import { colors, shadow, radius } from '@/lib/theme';
import { PressableScale } from '@/components/PressableScale';
import { FadeInView } from '@/components/FadeInView';
import { SkeletonCard } from '@/components/Skeleton';

// ─── Add Vehicle Modal ────────────────────────────────────────────────────────

function AddVehicleModal({ visible, onClose, onAdded }: {
  visible: boolean; onClose: () => void; onAdded: (v: Vehicle) => void;
}) {
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
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveButtonText}>Save Vehicle</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

function VehicleCard({ vehicle, onDelete }: { vehicle: Vehicle; onDelete: () => void }) {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 18,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 2 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.full, ...shadow.sm },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: 10,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: colors.primary },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 14,
  },
  cardAvatarText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  cardBody: { flex: 1, paddingVertical: 14 },
  plate: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: 1 },
  vehicleDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  zonePill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  zoneText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  deleteBtn: { padding: 16 },
  deleteText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12, ...shadow.sm },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal
  modalContent: { padding: 24, paddingBottom: 48 },
  modalHeader: { marginBottom: 24 },
  modalDrag: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalClose: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  required: { color: colors.danger },
  fieldInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text, backgroundColor: colors.bg,
  },
  saveButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 8, ...shadow.sm },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
