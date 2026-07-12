import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react';
import { SileoSkeleton } from '../ui/sileo-skeleton';

const ChatComponent = lazy(() => import('../Chat'));

function ChatFallback() {
  return (
    <div className="flex h-full min-h-[12rem] items-center justify-center bg-surface">
      <SileoSkeleton className="h-8 w-40" />
    </div>
  );
}

export function LazyChat(props: ComponentProps<typeof ChatComponent>) {
  return (
    <Suspense fallback={<ChatFallback />}>
      <ChatComponent {...props} />
    </Suspense>
  );
}

export default LazyChat as ComponentType<ComponentProps<typeof ChatComponent>>;
