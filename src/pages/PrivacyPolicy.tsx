import { API_CONFIG } from '../config/api';
import { LegalDocumentPage } from './LegalDocumentPage';

export function PrivacyPolicy() {
    return (
        <LegalDocumentPage
            endpoint={API_CONFIG.endpoints.legal.privacy}
            title="Política de privacidad"
            subtitle="Cómo tratamos tus datos personales conforme al RGPD y la LOPD-GDD: qué recopilamos, con qué fin y tus derechos."
            canonical="/legal/privacy"
            seoTitle="Política de privacidad · Inspecciono"
            seoDescription="Política de privacidad de Inspecciono conforme al RGPD y la LOPD-GDD: datos recopilados, finalidad, destinatarios, conservación y derechos del interesado."
            errorMessage="No se pudo cargar la política de privacidad. Por favor, inténtelo de nuevo más tarde."
        />
    );
}
