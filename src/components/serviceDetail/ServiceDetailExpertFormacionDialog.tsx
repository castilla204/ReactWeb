import FormacionDisplay from '../FormacionDisplay';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '../ui/dialog';

interface ServiceDetailExpertFormacionDialogProps {
    value?: string | null;
    expertName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Modal desktop — expediente académico completo (controlado desde fuera). */
export function ServiceDetailExpertFormacionDialog({
    value,
    expertName,
    open,
    onOpenChange,
}: ServiceDetailExpertFormacionDialogProps) {
    if (!value) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[min(88dvh,640px)] max-w-lg gap-0 overflow-hidden rounded-xl border-line p-0">
                <header className="border-b border-line px-6 py-4">
                    <DialogTitle className="font-display text-base font-semibold tracking-[-0.01em] text-ink-strong">
                        Expediente académico
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 text-sm text-ink-muted">
                        {expertName}
                    </DialogDescription>
                </header>
                <div className="overflow-y-auto px-6 py-4">
                    <FormacionDisplay value={value} variant="ficha" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
