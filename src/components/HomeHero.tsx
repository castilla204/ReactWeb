import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const HomeHero: React.FC = () => {
    const [currentCard, setCurrentCard] = useState(0);
    const cards = [
        {
            title: "Forma facil de encontrar\ncasa a buen preci",
            description: "Ofreciendo servicios de búsqueda\nseguros y confortables.",
            buttonText: "Buscar Casa",
            image: new URL('../media/house.png', import.meta.url).href,
            gradient: "from-blue-600 to-blue-700",
            imageClass: "-right-12 -bottom-16 transform-gpu [filter:drop-shadow(2px_4px_8px_rgba(0,0,0,0.2))_drop-shadow(0_30px_30px_rgba(29,78,216,0.35))_drop-shadow(0_20px_20px_rgba(59,130,246,0.45))]"
        },
        {
            title: "La Mejor Plataforma\npara Buscar Cochess",
            description: "Facilidad para buscar coches de forma segura\ny cercana. Por supuesto, a bajo precio.",
            buttonText: "Buscar Coche",
            image: new URL('../media/Car.png', import.meta.url).href,
            gradient: "from-blue-500 to-blue-600",
            imageClass: "-right-12 bottom-0"
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
            <div className="md:hidden relative w-full max-w-2xl mx-auto overflow-hidden mt-2">
                <div
                    className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${cards[currentCard].gradient} p-6 md:p-8 flex flex-col justify-between min-h-[280px] md:min-h-[320px] transition-opacity duration-500`}
                >
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            {cards[currentCard].title}
                            <div className="inline-flex items-center gap-2 ml-3 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                                <span>+</span>
                                <Sparkles className="w-4 h-4" />
                                <span>IA</span>
                            </div>
                        </h2>
                        <p className="text-blue-100 text-sm md:text-base mb-6">
                            {cards[currentCard].description}
                        </p>
                        <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                            {cards[currentCard].buttonText}
                        </button>
                    </div>
                    <img
                        src={cards[currentCard].image}
                        alt={cards[currentCard].buttonText}
                        className={`absolute w-64 md:w-72 object-contain ${cards[currentCard].imageClass}`}
                    />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {cards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentCard(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentCard ? 'bg-white' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 to-blue-600 p-8 flex flex-col justify-between min-h-[320px]">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            La Mejor Plataforma<br />
                            para Buscar Cochess
                            <div className="inline-flex items-center gap-2 ml-3 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                                <span>+</span>
                                <Sparkles className="w-4 h-4" />
                                <span>IA</span>
                            </div>
                        </h2>
                        <p className="text-blue-100 text-base mb-6">
                            Facilidad para buscar coches de forma segura<br />
                            y cercana. Por supuesto, a bajo precio.
                        </p>
                        <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                            Buscar Coche
                        </button>
                    </div>
                    <img
                        src={new URL('../media/Car.png', import.meta.url).href}
                        alt="White Sports Car"
                        className="absolute -right-12 bottom-0 w-72 object-contain"
                    />
                </div>
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 flex flex-col justify-between min-h-[320px]">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Forma fácil de encontrar<br />
                            casa a buen precio
                            <div className="inline-flex items-center gap-2 ml-3 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                                <span>+</span>
                                <Sparkles className="w-4 h-4" />
                                <span>IA</span>
                            </div>
                        </h2>
                        <p className="text-blue-100 text-base mb-6">
                            Ofreciendo servicios de búsqueda<br />
                            seguros y confortables.
                        </p>
                        <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                            Buscar Casa
                        </button>
                    </div>
                    <img
                        src={new URL('../media/house.png', import.meta.url).href}
                        alt="Modern House"
                        className="absolute -right-12 -bottom-16 w-72 object-contain transform-gpu [filter:drop-shadow(2px_4px_8px_rgba(0,0,0,0.2))_drop-shadow(0_30px_30px_rgba(29,78,216,0.35))_drop-shadow(0_20px_20px_rgba(59,130,246,0.45))]"
                    />
                </div>
            </div>
        </>
    );
};

export default HomeHero;