import { describe, it, expect } from 'vitest';
import { getStripPriceFrom, getStripThumbnails, buildStripSummary } from './mapStripSummary';

describe('getStripPriceFrom', () => {
    it('devuelve el precio mínimo > 0', () => {
        expect(getStripPriceFrom([{ price: 45 }, { price: 38 }, { price: 52 }])).toBe(38);
    });
    it('ignora precios 0/ausentes', () => {
        expect(getStripPriceFrom([{ price: 0 }, { price: 50 }, {}])).toBe(50);
    });
    it('null si no hay precios válidos', () => {
        expect(getStripPriceFrom([{ price: 0 }, {}])).toBeNull();
        expect(getStripPriceFrom([])).toBeNull();
    });
});

describe('getStripThumbnails', () => {
    it('toma la primera imagen de los primeros n servicios', () => {
        const svc = [
            { imageUrls: ['a1', 'a2'] },
            { ImageUrls: ['b1'] },
            { imageUrls: ['c1'] },
            { imageUrls: ['d1'] },
        ];
        expect(getStripThumbnails(svc, 3)).toEqual(['a1', 'b1', 'c1']);
    });
    it('descarta servicios sin imagen', () => {
        expect(getStripThumbnails([{ imageUrls: [] }, { imageUrls: ['x'] }], 3)).toEqual(['x']);
    });
});

describe('buildStripSummary', () => {
    it('orden no-default + precio', () => {
        expect(buildStripSummary({ sortLabel: 'Distancia', isDefaultSort: false, priceFrom: 38 }))
            .toBe('Distancia · desde 38€');
    });
    it('orden default solo muestra precio', () => {
        expect(buildStripSummary({ sortLabel: 'Relevancia', isDefaultSort: true, priceFrom: 38 }))
            .toBe('desde 38€');
    });
    it('sin precio y orden default → cadena vacía', () => {
        expect(buildStripSummary({ sortLabel: 'Relevancia', isDefaultSort: true, priceFrom: null }))
            .toBe('');
    });
});
