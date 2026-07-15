import type { CheckoutLocationData } from '../components/CheckoutLocationPicker';
import type { ChosenSlot } from '../components/SlotPicker';
import {
    COORD_OPTION_SELF_TITLE,
    COORD_OPTION_SELLER_TITLE,
} from '../components/checkout/CheckoutSellerCoordinationFields';
import { buildExpertLocationLabel, type HireSearchLocation } from './hireSearchContext';
import {
    SELLER_BOOKING_MIN_LEAD_DAYS,
    SELLER_BOOKING_TARGET_WINDOW_DAYS,
} from './sellerBookingWindow';

export function formatCheckoutLocationLabel(
    location: CheckoutLocationData | null | undefined,
): string | null {
    if (!location?.location?.trim()) return null;
    const parts = [location.location.trim()];
    if (location.doorNumber?.trim()) parts.push(location.doorNumber.trim());
    if (location.siteDetails?.trim()) parts.push(location.siteDetails.trim());
    return parts.join(' · ');
}

export interface CheckoutSummaryDisplayInput {
    requiresAppointment: boolean;
    coordinationMode: 'self' | 'seller' | null;
    chosenSlot: ChosenSlot | null;
    chosenLocation: CheckoutLocationData | null;
    isWorkshopOnly: boolean;
    hireSearchLocation: HireSearchLocation | null;
    expert?: {
        city?: string | null;
        country?: string | null;
        countryName?: string | null;
    };
    sellerPhone: string;
    sellerEmail: string;
    sellerListingUrl: string;
}

export interface CheckoutSummaryDisplay {
    coordinationLabel: string | null;
    appointmentLabel: string | null;
    locationLabel: string | null;
    locationHint: string | null;
    sellerContactLabel: string | null;
    sellerListingLabel: string | null;
}

export function buildCheckoutSummaryDisplay(
    input: CheckoutSummaryDisplayInput,
): CheckoutSummaryDisplay {
    const {
        requiresAppointment,
        coordinationMode,
        chosenSlot,
        chosenLocation,
        isWorkshopOnly,
        hireSearchLocation,
        expert,
        sellerPhone,
        sellerEmail,
        sellerListingUrl,
    } = input;

    if (!requiresAppointment) {
        return {
            coordinationLabel: null,
            appointmentLabel: null,
            locationLabel: null,
            locationHint: null,
            sellerContactLabel: null,
            sellerListingLabel: null,
        };
    }

    const coordinationLabel =
        coordinationMode === 'self'
            ? COORD_OPTION_SELF_TITLE
            : coordinationMode === 'seller'
              ? COORD_OPTION_SELLER_TITLE
              : null;

    let appointmentLabel: string | null = null;
    let locationLabel: string | null = null;
    let locationHint: string | null = null;

    const expertAreaLabel = buildExpertLocationLabel(expert ?? undefined);
    const pickedLocationLabel = formatCheckoutLocationLabel(chosenLocation);

    if (coordinationMode === 'self') {
        appointmentLabel = chosenSlot ? `${chosenSlot.dateLabel} · ${chosenSlot.label}` : null;
        locationLabel =
            pickedLocationLabel ??
            (isWorkshopOnly ? 'Taller del experto (punto fijo)' : null);
        if (!locationLabel && hireSearchLocation?.locationName) {
            locationHint = `Zona de búsqueda: ${hireSearchLocation.locationName}`;
        }
    } else if (coordinationMode === 'seller') {
        // «normalmente»: la ventana real es +1..+14 (se amplía si el experto no tiene huecos
        // en 1-5); sin el matiz, una cita a +10 días contradiría el resumen (auditoría M2).
        appointmentLabel = `El vendedor elige en la agenda del experto (normalmente ${SELLER_BOOKING_MIN_LEAD_DAYS}–${SELLER_BOOKING_TARGET_WINDOW_DAYS} días tras el pago)`;

        if (isWorkshopOnly) {
            locationLabel = pickedLocationLabel ?? 'Taller del experto (punto fijo)';
        } else if (hireSearchLocation?.locationName) {
            locationLabel = hireSearchLocation.locationName;
            locationHint = 'Dirección exacta la confirma el vendedor al reservar';
        } else if (expertAreaLabel) {
            locationLabel = expertAreaLabel;
            locationHint = 'Dirección exacta la confirma el vendedor al reservar';
        } else {
            locationLabel = 'Zona acordada con el vendedor';
            locationHint = 'Dirección exacta al reservar';
        }
    }

    const sellerContactParts = [sellerPhone.trim(), sellerEmail.trim()].filter(Boolean);
    const sellerContactLabel =
        coordinationMode === 'seller' && sellerContactParts.length > 0
            ? sellerContactParts.join(' · ')
            : null;
    const sellerListingLabel =
        coordinationMode === 'seller' && sellerListingUrl.trim()
            ? sellerListingUrl.trim()
            : null;

    return {
        coordinationLabel,
        appointmentLabel,
        locationLabel,
        locationHint,
        sellerContactLabel,
        sellerListingLabel,
    };
}
