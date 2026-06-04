/** Espejo de newApi.Common.SupportedConnectCountries */
export const SUPPORTED_PAYOUT_COUNTRIES = new Set<string>([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
    'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'NO', 'LI',
    'US', 'CA', 'GB', 'CH',
]);

const COUNTRY_NAMES_ES: Record<string, string> = {
    AT: 'Austria', BE: 'Bélgica', BG: 'Bulgaria', HR: 'Croacia', CY: 'Chipre', CZ: 'Chequia',
    DK: 'Dinamarca', EE: 'Estonia', FI: 'Finlandia', FR: 'Francia', DE: 'Alemania', GR: 'Grecia',
    HU: 'Hungría', IE: 'Irlanda', IT: 'Italia', LV: 'Letonia', LT: 'Lituania', LU: 'Luxemburgo',
    MT: 'Malta', NL: 'Países Bajos', PL: 'Polonia', PT: 'Portugal', RO: 'Rumanía', SK: 'Eslovaquia',
    SI: 'Eslovenia', ES: 'España', SE: 'Suecia', NO: 'Noruega', LI: 'Liechtenstein',
    US: 'Estados Unidos', CA: 'Canadá', GB: 'Reino Unido', CH: 'Suiza',
};

export function isSupportedPayoutCountry(code: string | null | undefined): boolean {
    if (!code) return false;
    return SUPPORTED_PAYOUT_COUNTRIES.has(code.toUpperCase());
}

export function formatPayoutCountryLabel(code: string): string {
    const cc = code.toUpperCase();
    const name = COUNTRY_NAMES_ES[cc];
    return name ? `${name} (${cc})` : cc;
}
