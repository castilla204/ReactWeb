import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react';
import { SileoSkeleton } from '../ui/sileo-skeleton';

const AppointmentMap = lazy(() => import('../AppointmentMap'));

function MapFallback({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex min-h-[12rem] items-center justify-center bg-white ${className}`}
      role="status"
      aria-label="Cargando mapa"
    >
      <SileoSkeleton className="h-full w-full min-h-[12rem] rounded-none" />
    </div>
  );
}

export function LazyAppointmentMap(props: ComponentProps<typeof AppointmentMap>) {
  return (
    <Suspense fallback={<MapFallback className={props.className} />}>
      <AppointmentMap {...props} />
    </Suspense>
  );
}

export default LazyAppointmentMap as ComponentType<ComponentProps<typeof AppointmentMap>>;
