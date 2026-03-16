import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Vehicle, VehicleCreate, vehiclesApi } from '@/lib/api';

// ─── Add Vehicle Modal ────────────────────────────────────────────────────────

function AddVehicleModal({
  visible,
  onClose,
  onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: (v: Vehicle) => void;
}) {
  const [form, setForm] = useState<VehicleCreate>({
    plate_number: '',
    make: '',
    model: '',
    color: '',
    parking_zone: null,
  });
  const [saving, setSaving] = useState(false);

  const set = (field: keyof VehicleCreate) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value || null }));

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Register Vehicle</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {(
            [
              { field: 'plate_number', label: 'Plate Number *', placeholder: 'ABC 123', caps: true },
              { field: 'make',         label: 'Make *',         placeholder: 'Toyota' },
              { field: 'model',        label: 'Model *',        placeholder: 'Camry' },
              { field: 'color',        label: 'Colour *',       placeholder: 'Silver' },
              { field: 'parking_zone', label: 'Parking Zone',   placeholder: 'Zone A (optional)' },
            ] as const
          ).map(({ field, label, placeholder, caps }) => (
            <View key={field} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form[field] ?? ''}
                onChangeText={set(field)}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                autoCapitalize={caps ? 'characters' : 'words'}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Vehicle</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

function VehicleCard({
  vehicle,
  onDelete,
}: {
  vehicle: Vehicle;
  onDelete: () => void;
}) {
  const confirmDelete = () =>
    Alert.alert(
      'Remove vehicle',
      `Remove ${vehicle.plate_number} from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onDelete },
      ],
    );

  return (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <Text style={styles.plate}>{vehicle.plate_number}</Text>
        <Text style={styles.vehicleDesc}>
          {vehicle.color} {vehicle.make} {vehicle.model}
        </Text>
        {vehicle.parking_zone ? (
          <Text style={styles.zone}>Zone: {vehicle.parking_zone}</Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>Remove</Text>
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
    try {
      const data = await vehiclesApi.list();
      setVehicles(data);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const handleAdded = (v: Vehicle) => {
    setVehicles((prev) => [v, ...prev]);
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await vehiclesApi.delete(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Vehicles</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563EB" />
      ) : vehicles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptySub}>Register a vehicle to receive alerts when it is reported.</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <VehicleCard vehicle={item} onDelete={() => handleDelete(item.id)} />
          )}
        />
      )}

      <AddVehicleModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={handleAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  addBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardMain: { flex: 1 },
  plate: { fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: 1 },
  vehicleDesc: { fontSize: 14, color: '#374151', marginTop: 2 },
  zone: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  deleteBtn: { padding: 8 },
  deleteText: { color: '#EF4444', fontWeight: '500', fontSize: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  // Modal
  modalContent: { padding: 24, paddingBottom: 48 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 16, color: '#2563EB', fontWeight: '500' },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
