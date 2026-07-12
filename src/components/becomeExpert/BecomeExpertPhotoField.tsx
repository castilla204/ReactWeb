import React, { useRef, useState } from 'react';
import { Camera, Pencil } from 'lucide-react';
import { ProfilePhotoCropModal } from './ProfilePhotoCropModal';
import { PROFILE_PHOTO_MAX_BYTES } from '../../utils/profilePhotoCrop';
import { showToast } from '../../lib/toast';
import { HP_LINK_UNDERLINE_CLASS } from '../../constants/homepageTypography';

type BecomeExpertPhotoFieldProps = {
    previewUrl: string | null;
    onPhotoReady: (file: File, previewUrl: string) => void;
};

export function BecomeExpertPhotoField({ previewUrl, onPhotoReady }: BecomeExpertPhotoFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [cropFile, setCropFile] = useState<File | null>(null);
    const [cropOpen, setCropOpen] = useState(false);

    const openPicker = () => inputRef.current?.click();

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (file.size > PROFILE_PHOTO_MAX_BYTES) {
            showToast('error', 'La imagen no puede superar los 5 MB');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            showToast('error', 'Solo se permiten imágenes JPG o PNG');
            return;
        }

        setCropFile(file);
        setCropOpen(true);
    };

    return (
        <>
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={openPicker}
                    className="group relative shrink-0"
                    aria-label={previewUrl ? 'Cambiar foto de perfil' : 'Añadir foto de perfil'}
                >
                    <div className="relative h-20 w-20 overflow-hidden rounded-full bg-surface-tinted ring-1 ring-line sm:h-[88px] sm:w-[88px]">
                        {previewUrl ? (
                            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-soft">
                                <Camera className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                            </div>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                            <Pencil className="h-4 w-4 text-white" aria-hidden />
                        </span>
                    </div>
                </button>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-strong">Foto de perfil</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                        Rostro centrado, fondo neutro y buena luz. Podrás recortar antes de guardar.
                    </p>
                    <button
                        type="button"
                        onClick={openPicker}
                        className={`mt-2 text-sm font-semibold ${HP_LINK_UNDERLINE_CLASS}`}
                    >
                        {previewUrl ? 'Cambiar foto' : 'Subir y encuadrar'}
                    </button>
                    <p className="mt-1.5 text-kicker text-ink-soft">JPG o PNG · máx. 5 MB</p>
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                capture="user"
                onChange={handleFileSelected}
                className="hidden"
            />

            <ProfilePhotoCropModal
                open={cropOpen}
                onOpenChange={setCropOpen}
                file={cropFile}
                onConfirm={(file, url) => {
                    onPhotoReady(file, url);
                    setCropFile(null);
                }}
            />
        </>
    );
}
