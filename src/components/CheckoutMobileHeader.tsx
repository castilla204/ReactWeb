import React from 'react';
import { useNavigate } from 'react-router-dom';
import erizoImg from '../media/erizo.png';
import {
    HP_FONT,
    SD_CHECKOUT_MOBILE_GUTTER_CLASS,
} from '../constants/homepageTypography';

export const CheckoutMobileHeader: React.FC = () => {
    const navigate = useNavigate();

    return (
        <header
            className={cn(
                SD_CHECKOUT_MOBILE_GUTTER_CLASS,
                'flex items-center justify-between border-b border-line bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]'
            )}
        >
            <span
                className="text-subtitle font-extrabold tracking-[-0.02em] text-brand"
                style={{ fontFamily: HP_FONT }}
            >
                Inspecciono<span className="text-amber-500">.</span>
            </span>
            <a
                href="/"
                onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                }}
                className="inline-flex h-8 shrink-0 items-center gap-2"
                aria-label="Inspecciono — inicio"
            >
                <img
                    src={erizoImg}
                    alt=""
                    className="h-7 w-7 -scale-x-100 shrink-0 object-contain"
                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
            </a>
        </header>
    );
};

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}