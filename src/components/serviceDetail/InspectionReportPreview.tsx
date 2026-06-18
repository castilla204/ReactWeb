import { useState } from 'react';
import { FileText, Maximize2 } from 'lucide-react';
import { ResponsiveModal } from '../ui/responsive-modal';

/**
 * Tarjeta compacta en el detalle del servicio: muestra de forma reducida que
 * hay un informe de inspección y, al pulsar, abre el PDF completo en modal
 * (escritorio) / drawer (móvil).
 */
export default function InspectionReportPreview({ pdfUrl }: { pdfUrl: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="mx-auto max-w-3xl px-4 py-4">
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
            >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">Informe de inspección que recibirás</span>
                    <span className="block text-xs text-gray-500">Pulsa para ver el PDF rellenable al completo</span>
                </span>
                <Maximize2 className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            </button>

            <ResponsiveModal
                open={open}
                onOpenChange={setOpen}
                title="Informe de inspección"
                description="Así es el informe que recibirás tras la inspección."
                dialogClassName="md:max-w-[820px]"
            >
                <object
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full rounded-lg border border-gray-200 bg-gray-100"
                    style={{ height: '72vh' }}
                >
                    <p className="p-4 text-sm text-gray-600">
                        Tu navegador no puede mostrar el PDF.{' '}
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                            Abrir el informe →
                        </a>
                    </p>
                </object>
            </ResponsiveModal>
        </div>
    );
}
