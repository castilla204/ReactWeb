// TEMP DEV-ONLY: harness pestaña Disponibilidad sin auth ni backend. Borrar tras verificar.
import React from 'react';
import AvailabilityTab from '../components/expertPanel/AvailabilityTab';

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const installMockFetch = () => {
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        const method = (init?.method || 'GET').toUpperCase();
        if (url.includes('/api/ExpertAvailability/rules')) {
            return new Response(JSON.stringify([1,2,3,4,5].map((d) => ({ dayOfWeek: d, startLocal: '09:00', endLocal: '18:00' }))), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.includes('/api/ExpertAvailability/current')) {
            return new Response(JSON.stringify({ daysOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'], startTime: '09:00:00', endTime: '18:00:00' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.includes('/api/ExpertAvailability/exceptions')) {
            if (method === 'GET') {
                const close = new Date(); close.setDate(close.getDate() + 2);
                const special = new Date(); special.setDate(special.getDate() + 6);
                return new Response(JSON.stringify([
                    { date: toYmd(close), isWorking: false, ranges: [] },
                    { date: toYmd(special), isWorking: true, ranges: [{ start: '10:00', end: '14:00' }] },
                ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return realFetch(input as RequestInfo, init);
    };
};

installMockFetch();

const DevAvailabilityTabPreview: React.FC = () => (
    <div style={{ background: '#f4f5f7', minHeight: '100vh' }}>
        <AvailabilityTab />
    </div>
);

export default DevAvailabilityTabPreview;
