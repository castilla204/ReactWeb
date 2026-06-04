import { Check } from 'lucide-react';

const ITEMS = [
    'Perfil verificado para clientes',
    'Cobros seguros con Stripe',
    'Tú defines zona y horarios',
] as const;

export function BecomeExpertTrustStrip() {
    return (
        <ul className="flex flex-col gap-2 rounded-lg bg-[#f5f8fc] px-3.5 py-3 lg:hidden" aria-label="Ventajas del programa">
            {ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-[#444]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2.5} aria-hidden />
                    {item}
                </li>
            ))}
        </ul>
    );
}
