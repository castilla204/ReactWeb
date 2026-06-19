import React from 'react';
import { Link2, Mail, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';

const fieldClass =
    'w-full rounded-xl bg-[#f4f5f7] py-3 pl-10 pr-3.5 text-sm text-[#1c1c1c] outline-none transition-colors placeholder:text-[#9aa0aa] focus:bg-white focus:ring-2 focus:ring-brand/30';

export interface CheckoutSellerCoordinationFieldsProps {
    sellerPhone: string;
    sellerEmail: string;
    sellerListingUrl: string;
    onSellerPhoneChange: (value: string) => void;
    onSellerEmailChange: (value: string) => void;
    onSellerListingUrlChange: (value: string) => void;
    /** Móvil: paso plazos o contacto por separado; desktop usa full. */
    variant?: 'full' | 'plazos' | 'contact';
    className?: string;
}

export function sellerCoordinationCanContinue(phone: string, email: string) {
    return phone.trim().length > 0 || email.trim().length > 0;
}

interface IconFieldProps {
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}

function IconField({ icon: Icon, children }: IconFieldProps) {
    return (
        <div className="relative">
            <Icon
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0aa]"
                aria-hidden
            />
            {children}
        </div>
    );
}

export function CheckoutSellerCoordinationFields({
    sellerPhone,
    sellerEmail,
    sellerListingUrl,
    onSellerPhoneChange,
    onSellerEmailChange,
    onSellerListingUrlChange,
    variant = 'full',
    className,
}: CheckoutSellerCoordinationFieldsProps) {
    const showContact = variant === 'full' || variant === 'contact';
    const showPlazos = variant === 'full' || variant === 'plazos';

    return (
        <div className={cn(showContact && showPlazos ? 'space-y-6' : 'space-y-0', className)}>
            {showContact ? (
                <div className="space-y-2.5">
                    <IconField icon={Phone}>
                        <input
                            value={sellerPhone}
                            onChange={(e) => onSellerPhoneChange(e.target.value)}
                            placeholder="Teléfono del vendedor"
                            className={fieldClass}
                            autoComplete="tel"
                            inputMode="tel"
                        />
                    </IconField>
                    <IconField icon={Mail}>
                        <input
                            value={sellerEmail}
                            onChange={(e) => onSellerEmailChange(e.target.value)}
                            placeholder="Email del vendedor (opcional)"
                            type="email"
                            className={fieldClass}
                            autoComplete="email"
                        />
                    </IconField>
                    <IconField icon={Link2}>
                        <input
                            value={sellerListingUrl}
                            onChange={(e) => onSellerListingUrlChange(e.target.value)}
                            placeholder="Enlace del anuncio (opcional)"
                            type="url"
                            className={fieldClass}
                            inputMode="url"
                        />
                    </IconField>
                    <p className="text-xs leading-relaxed text-[#6a6a6a]">
                        Indica al menos un teléfono o email. Le enviaremos un enlace para que elija
                        día, hora y lugar.
                    </p>
                </div>
            ) : null}

            {showPlazos ? (
                <div className="space-y-1.5">
                    <p className="text-[15px] leading-snug text-[#1c1c1c]">
                        El técnico visitará al vendedor <span className="font-semibold">entre 3 y 7 días</span>.
                    </p>
                    <p className="text-[11px] leading-relaxed text-[#9ca3af]">
                        Si su agenda está completa, hasta un máximo de 14 días · reembolso 100% si no se reserva.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
