import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface HomeHeroProps {
    onSelectService: (serviceTypeId: number) => void;
    selectedServiceTypeId: number | null;
}

const HomeHero: React.FC<HomeHeroProps> = ({ onSelectService, selectedServiceTypeId }) => {
    const [currentCard, setCurrentCard] = useState(0);
    const cards = [
        {
            title: "Encuentra tu hogar ideal\ncon facilidad",
            description: "Búsqueda avanzada en web combinada con revisiones presenciales para garantizar la mejor elección.",
            buttonText: "Búsqueda Web + Revisión Presencial",
            image: new URL('../media/house-modern.png', import.meta.url).href,
            gradient: "from-blue-700 via-blue-600 to-blue-500",
            serviceTypeId: 1
        },
        {
            title: "El coche perfecto\nestá a tu alcance",
            description: "Revisiones presenciales detalladas para asegurar la calidad de tu próxima compra.",
            buttonText: "Solo Revisión Presencial",
            image: new URL('../media/car-modern.png', import.meta.url).href,
            gradient: "from-blue-600 via-blue-500 to-blue-400",
            serviceTypeId: 2
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentCard((current) => (current + 1) % cards.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-blue-50" />
                <div className="absolute top-0 -right-1/4 w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-transparent rounded-full blur-3xl animate-pulse" />
                </div>
                <div className="absolute bottom-0 -left-1/4 w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-blue-400/10 to-transparent rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(37,99,235,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(96,165,250,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-100/10 to-transparent opacity-30 animate-gradient" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/10 to-transparent opacity-20 animate-gradient [animation-delay:2s]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAyMCAwIEwgMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg5NiwgMTY1LCAyNTAsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)" opacity="0.5"/%3E%3C/svg%3E")',
                    filter: 'contrast(200%) brightness(150%)'
                }} />
            </div>
            <div className="md:hidden relative w-full max-w-2xl mx-auto overflow-hidden mt-4">
                <div
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cards[currentCard].gradient} p-6 flex flex-col justify-between min-h-[360px] transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:shadow-2xl ${selectedServiceTypeId === cards[currentCard].serviceTypeId ? 'ring-4 ring-blue-400/50 shadow-xl scale-[1.01]' : ''}`}
                    onClick={() => onSelectService(cards[currentCard].serviceTypeId)}
                >
                    <div className="relative z-10">
                        <h2 className="text-3xl font-extrabold text-white mb-3 leading-tight drop-shadow-md">
                            {cards[currentCard].title.split('\n').map((line, index) => (
                                <span key={index} className="block">{line}</span>
                            ))}
                            <div className="inline-flex items-center gap-2 ml-2 mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold text-white">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                <span>Potenciado por IA</span>
                            </div>
                        </h2>
                        <p className="text-blue-100 text-base mb-6 font-medium max-w-[60%] leading-relaxed">
                            {cards[currentCard].description}
                        </p>
                        <button className="bg-white text-blue-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                            {cards[currentCard].buttonText}
                        </button>
                    </div>
                    <img
                        src={cards[currentCard].image}
                        alt={cards[currentCard].buttonText}
                        className="absolute right-0 bottom-0 w-[50%] object-cover rounded-bl-2xl shadow-2xl transform translate-x-4 -translate-y-4"
                    />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentCard(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentCard ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-8 mt-8">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-8 flex flex-col justify-between min-h-[400px] cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${selectedServiceTypeId === card.serviceTypeId ? 'ring-4 ring-blue-400/50 shadow-xl scale-[1.01]' : ''}`}
                        onClick={() => onSelectService(card.serviceTypeId)}
                    >
                        <div className="relative z-10">
                            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight drop-shadow-md">
                                {card.title.split('\n').map((line, i) => (
                                    <span key={i} className="block">{line}</span>
                                ))}
                                <div className="inline-flex items-center gap-2 ml-3 mt-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold text-white">
                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                    <span>Potenciado por IA</span>
                                </div>
                            </h2>
                            <p className="text-blue-100 text-lg mb-8 font-medium max-w-[60%] leading-relaxed">
                                {card.description}
                            </p>
                            <button className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                                {card.buttonText}
                            </button>
                        </div>
                        <img
                            src={card.image}
                            alt={card.buttonText}
                            className="absolute right-0 bottom-0 w-[45%] object-cover rounded-bl-2xl shadow-2xl transform translate-x-6 -translate-y-6"
                        />
                    </div>
                ))}
            </div>
        </>
    );
};

export default HomeHero;