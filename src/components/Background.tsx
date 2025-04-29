import React from 'react';

const Background: React.FC = () => (
    <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-white">
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
            }} />
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: '160px 160px'
            }} />
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,white_70%)]" />
            <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
            <div className="absolute right-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
            <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        </div>
    </div>
);

export default Background;