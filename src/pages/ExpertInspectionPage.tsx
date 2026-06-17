import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PdfFormEditor from '../components/inspection/PdfFormEditor';

// Página que abre el experto desde una contratación aceptada para rellenar el
// informe de inspección directamente sobre el PDF. El borrador (datos + PDF
// rellenado) se autoguarda en el dispositivo (IndexedDB) según se edita.
export default function ExpertInspectionPage() {
    const { hireId } = useParams<{ hireId: string }>();
    const navigate = useNavigate();

    if (!hireId) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-gray-600">
                No se encontró la contratación.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="mx-auto max-w-[900px] px-3 pt-3">
                <button
                    type="button"
                    onClick={() => navigate('/expert-panel')}
                    className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-600"
                >
                    <ArrowLeft size={16} /> Volver al panel
                </button>
                <PdfFormEditor
                    hireId={hireId}
                    onSaved={() => {
                        // TODO: subir el PDF al backend cuando haya conexión
                        // (el blob llega como primer argumento de onSaved).
                    }}
                />
            </div>
        </div>
    );
}
