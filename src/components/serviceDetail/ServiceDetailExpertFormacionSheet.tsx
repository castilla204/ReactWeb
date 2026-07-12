import FormacionDisplay from '../FormacionDisplay';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';

interface ServiceDetailExpertFormacionSheetProps {
    value?: string | null;
    expertName: string;
    expertDescription?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Panel inferior móvil — expediente académico completo (controlado desde fuera). */
export function ServiceDetailExpertFormacionSheet({
    value,
    expertName,
    expertDescription,
    open,
    onOpenChange,
}: ServiceDetailExpertFormacionSheetProps) {
    if (!value) return null;

    const trimmedDescription = expertDescription?.trim() ?? '';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="sd-formacion-sheet-panel max-h-[min(88dvh,640px)] overflow-y-auto rounded-t-xl border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_24px_rgba(15,23,42,0.08)]"
            >
                <div
                    className="mx-auto mb-3 h-1 w-9 shrink-0 rounded-full bg-line"
                    aria-hidden
                />
                <SheetHeader className="mb-3 space-y-0.5 pr-8 text-left">
                    <SheetTitle className="font-display text-base font-semibold tracking-[-0.01em] text-ink-strong">
                        Expediente académico
                    </SheetTitle>
                    <p className="text-sm text-ink-muted">{expertName}</p>
                </SheetHeader>
                {trimmedDescription ? (
                    <p className="sd-user-text mb-4 text-sm leading-snug text-ink-muted">
                        {trimmedDescription}
                    </p>
                ) : null}
                <FormacionDisplay value={value} variant="ficha" />
            </SheetContent>
        </Sheet>
    );
}
