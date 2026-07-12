import React from 'react';
import { FolderTree } from 'lucide-react';

const categoryAssets: { match: (name: string) => boolean; src: string; alt: string }[] = [
    {
        match: (n) => n.includes('moto') && n.includes('agua'),
        src: new URL('../../media/motoagua.png', import.meta.url).href,
        alt: 'Moto de agua',
    },
    {
        match: (n) => n.includes('moto') && !n.includes('agua'),
        src: new URL('../../media/motopng.png', import.meta.url).href,
        alt: 'Moto',
    },
    {
        match: (n) => n.includes('coche') || n.includes('vehículo'),
        src: new URL('../../media/cochepng.png', import.meta.url).href,
        alt: 'Coche',
    },
    {
        match: (n) =>
            n.includes('inmobiliaria') || n.includes('casa') || n.includes('inmueble'),
        src: new URL('../../media/casapng.png', import.meta.url).href,
        alt: 'Inmueble',
    },
];

export function SearchCategoryIcon({
    categoryName,
    className = 'h-10 w-10 object-contain',
}: {
    categoryName: string;
    className?: string;
}) {
    const safe = categoryName ? String(categoryName).toLowerCase() : '';
    const asset = categoryAssets.find((a) => a.match(safe));

    if (asset) {
        return <img src={asset.src} alt={asset.alt} className={className} />;
    }

    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-line-soft">
            <FolderTree className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
        </div>
    );
}
