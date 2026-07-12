// Modelo compartido de "formación" del experto.
// Es OPCIONAL y no requiere verificación de ninguna entidad. Se guarda como JSON
// (un array de items) en el campo `formacion` del perfil y se muestra al cliente.
// La imagen del título/diploma se guarda comprimida como data URL dentro del JSON
// (así no hace falta un endpoint de subida aparte).

export interface FormacionItem {
    titulo: string;      // p. ej. "Ingeniero Técnico Industrial" / "Curso de peritaje"
    esOficial?: boolean; // título oficial (universidad, FP, certificado profesional)
    centro?: string;     // p. ej. "Universidad Politécnica de Valencia"
    anio?: string;       // p. ej. "2010" (texto libre)
    imagen?: string;     // data URL (foto del título/diploma o del centro), comprimida
}

export function parseFormacion(json?: string | null): FormacionItem[] {
    if (!json) return [];
    try {
        const data = JSON.parse(json);
        if (!Array.isArray(data)) return [];
        return data
            .filter((x) => x && typeof x.titulo === 'string')
            .map((x) => ({
                titulo: String(x.titulo),
                esOficial: Boolean(x.esOficial),
                centro: x.centro ? String(x.centro) : undefined,
                anio: x.anio ? String(x.anio) : undefined,
                imagen: typeof x.imagen === 'string' && x.imagen.startsWith('data:') ? x.imagen : undefined,
            }));
    } catch {
        return [];
    }
}

/** Resumen compacto para la fila del experto en desktop (títulos separados por ·). */
export function formatFormacionInlineSummary(
    json?: string | null,
    maxVisible = 2,
): { text: string; fullText: string; hiddenCount: number; linkLabel: string } {
    const items = parseFormacion(json);
    if (items.length === 0) {
        return { text: '', fullText: '', hiddenCount: 0, linkLabel: '' };
    }

    const sorted = [...items].sort((a, b) => Number(Boolean(b.esOficial)) - Number(Boolean(a.esOficial)));
    const visible = sorted.slice(0, maxVisible);
    const hiddenCount = Math.max(0, sorted.length - visible.length);

    const labelFor = (item: FormacionItem) => item.titulo.trim();
    const fullText = sorted.map(labelFor).join(' · ');
    let text = visible.map(labelFor).join(' · ');
    if (hiddenCount > 0) {
        text += ` · +${hiddenCount}`;
    }

    let linkLabel: string;
    if (sorted.length === 1) {
        linkLabel = labelFor(sorted[0]);
    } else if (sorted.length === 2) {
        linkLabel = sorted.map(labelFor).join(' · ');
    } else {
        linkLabel = `${labelFor(sorted[0])} · +${sorted.length - 1}`;
    }

    return { text, fullText, hiddenCount, linkLabel };
}

export function stringifyFormacion(items: FormacionItem[]): string {
    const clean = items
        .map((i) => ({
            titulo: i.titulo.trim(),
            esOficial: i.esOficial ? true : undefined,
            centro: i.centro?.trim() || undefined,
            anio: i.anio?.trim() || undefined,
            imagen: i.imagen || undefined,
        }))
        .filter((i) => i.titulo.length > 0);
    return JSON.stringify(clean);
}

// Comprime una imagen a un data URL pequeño (para que quepa cómodo en el JSON).
export function compressImageToDataUrl(file: File, maxW = 900, quality = 0.6): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxW / img.width);
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('no-ctx'));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = String(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
