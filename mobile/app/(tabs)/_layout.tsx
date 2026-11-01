import { Redirect, Tabs } from 'expo-router';
import { Text, View, type ColorValue } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { themedStyles, useTheme } from '@/lib/theme';

function TabIcon({ emoji, color, focused }: { emoji: string; color: ColorValue; focused: boolean }) {
  const s = useStyles();
  return (
    <View style={[s.iconWrap, focused && s.iconWrapActive]}>
      <Text style={s.iconText}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="🏠" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="📋" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="🚗" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="🔔" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon emoji="👤" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const useStyles = themedStyles((c) => ({
  iconWrap: {
    width: 32,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: c.brandTint,
  },
  iconText: { fontSize: 18 },
}));
