import { Redirect, Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ReportScreen } from '@/components/report/ReportScreen';

/** The report flow full screen, opened from Android's Report button, with an X to close. */
export default function NewReport() {
  const router = useRouter();
  const { session, loading } = useAuth();
  if (!loading && !session) return <Redirect href="/(auth)" />;
  return (
    <>
      <Stack.Screen options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <ReportScreen onClose={() => router.back()} />
    </>
  );
}
