import React, { useState, useEffect } from 'react';
import { Shield, Search, Sparkles } from 'lucide-react';

const HomePresentation = ({ onSelectService, selectedServiceTypeId, onScrollToForm }) => {
    const [currentCard, setCurrentCard] = useState(0);
    const cards = [
        {
            title: "Encuentra tu hogar ideal\ncon facilidad",
            description: "Búsqueda avanzada en web combinada con revisiones presenciales para garantizar la mejor elección.",
            buttonText: "Búsqueda Web + Revisión Presencial",
            image: new URL('../media/house-modern.png', import.meta.url).href,
            gradient: "from-blue-700 via-blue-600 to-blue-500",
            serviceTypeId: 1,
        },
        {
            title: "El coche perfecto\nestá a tu alcance",
            description: "Revisiones presenciales detalladas para asegurar la calidad de tu próxima compra.",
            buttonText: "Solo Revisión Presencial",
            image: new URL('../media/car-modern.png', import.meta.url).href,
            gradient: "from-blue-600 via-blue-500 to-blue-400",
            serviceTypeId: 2,
        },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentCard((current) => (current + 1) % cards.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(37,99,235,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-100/10 to-transparent opacity-30 animate-gradient" />
            </div>
            <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="order-2 md:order-1">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-6 leading-tight">
                            Tu eliges el coche<br />y nosotros hacemos todo lo demás
                        </h1>
                        <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-lg">
                            La manera más fácil y segura de comprar un coche de segunda mano desde casa.
                        </p>
                        <button
                            onClick={onScrollToForm}
                            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all shadow-md hover:shadow-lg"
                        >
                            Contrata tu revisión hoy
                        </button>
                        <div className="mt-10 flex flex-col md:flex-row justify-start gap-6 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <Shield className="w-6 h-6 text-blue-600" />
                                <span className="text-gray-700 font-medium">+10 años de experiencia</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Search className="w-6 h-6 text-blue-600" />
                                <span className="text-gray-700 font-medium">+25.000 coches revisados</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-blue-600" />
                                <span className="text-gray-700 font-medium">+30 técnicos revisando</span>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2 flex justify-center md:justify-end">
                        <img
                            src={new URL('../media/fotohome.png', import.meta.url).href}
                            alt="Home Presentation"
                            className="rounded-xl shadow-lg w-full max-w-xs md:max-w-md object-cover transform hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                </div>
                <div className="mt-20">
                    <div className="md:hidden relative w-full max-w-2xl mx-auto overflow-hidden">
                        <div
                            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cards[currentCard].gradient} p-6 flex flex-col justify-between min-h-[360px] transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:shadow-2xl ${selectedServiceTypeId === cards[currentCard].serviceTypeId ? 'ring-4 ring-blue-400/50 shadow-xl scale-[1.01]' : ''}`}
                            onClick={() => onSelectService(cards[currentCard].serviceTypeId)}
                        >
                            <div className="relative z-10">
                                <h2 className="text-3xl font-extrabold text-white mb-3 leading-tight drop-shadow-md">
                                    {cards[currentCard].title.split('\n').map((line, index) => (
                                        <span key={index} className="block">{line}</span>
                                    ))}
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
                    <div className="hidden md:grid grid-cols-2 gap-8">
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
                </div>
            </div>
        </div>
    );
};

export default HomePresentation;