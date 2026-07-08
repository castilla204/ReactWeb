import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import StatusBadge from '../StatusBadge';
import type { SystemStatusDto } from '../../types/searchDetails';

type MobileSearchHireHeaderProps = {
  title: string;
  onBack?: () => void;
  searchHireStatusInfo?: SystemStatusDto | null;
  appointmentStatusInfo?: SystemStatusDto | null;
};

export function MobileSearchHireHeader({
  title,
  onBack,
  searchHireStatusInfo,
  appointmentStatusInfo,
}: MobileSearchHireHeaderProps) {
  return (
    <header className="lg:hidden flex shrink-0 items-center gap-2 border-b border-[#ebebeb] bg-white px-3 py-2.5 z-40">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="h-9 w-9 shrink-0 rounded-full hover:bg-[#f5f5f5]"
        aria-label="Volver"
      >
        <ArrowLeft className="h-5 w-5 text-[#444]" />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#1c1c1c] leading-tight">
          {title}
        </h1>
        {(searchHireStatusInfo || appointmentStatusInfo) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {searchHireStatusInfo && (
              <StatusBadge statusInfo={searchHireStatusInfo} />
            )}
            {appointmentStatusInfo && (
              <StatusBadge statusInfo={appointmentStatusInfo} />
            )}
          </div>
        )}
      </div>
    </header>
  );
}
