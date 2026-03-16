import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>RePark</Text>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/vehicles')}>
        <Text style={styles.cardIcon}>🚗</Text>
        <Text style={styles.cardTitle}>Register My Vehicle</Text>
        <Text style={styles.cardSub}>Add your plate to receive alerts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/report')}>
        <Text style={styles.cardIcon}>📋</Text>
        <Text style={styles.cardTitle}>Report a Vehicle</Text>
        <Text style={styles.cardSub}>Alert an owner anonymously</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/alerts')}>
        <Text style={styles.cardIcon}>🔔</Text>
        <Text style={styles.cardTitle}>View Alerts</Text>
        <Text style={styles.cardSub}>Check your notification inbox</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#6B7280',
  },
});
