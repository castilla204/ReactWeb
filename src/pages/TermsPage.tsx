import { API_CONFIG } from '../config/api';
import { LegalDocumentPage } from './LegalDocumentPage';

export function TermsPage() {
    return (
        <LegalDocumentPage
            endpoint={API_CONFIG.endpoints.legal.terms}
            title="Términos y condiciones"
            subtitle="Reglas de uso de la plataforma: intermediación, pagos, comisiones y responsabilidades."
            canonical="/terms.html"
            seoTitle="Términos y condiciones · Inspecciono"
            seoDescription="Términos y condiciones de uso de Inspecciono: intermediación entre clientes y expertos, pagos seguros, comisiones y distribución de fondos."
            errorMessage="No se pudieron cargar los términos y condiciones. Por favor, inténtelo de nuevo más tarde."
        />
    );
}
