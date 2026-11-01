import type { Metadata } from 'next';
import { VehiclesView } from './VehiclesView';

export const metadata: Metadata = { title: 'My vehicles' };

export default function Page() {
  return <VehiclesView />;
}
