
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AiAction, AppData } from '../types';
import { runChat } from '../services/geminiService';
import Markdown from 'react-markdown';


interface ChatbotProps {
    isOpen: boolean;
    onToggle: () => void;
    onAction: (action: AiAction) => string;
    contextData: AppData;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onToggle, onAction, contextData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', sender: 'bot', text: 'Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte? Puedes pedirme que agregue jugadores, registre pagos o genere informes.' }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: input };
        const loadingMessage: ChatMessage = { id: 'loading', sender: 'bot', text: '...', isLoading: true };

        setMessages(prev => [...prev, userMessage, loadingMessage]);
        setInput('');

        try {
            const result = await runChat(input, contextData);

            let botResponse: ChatMessage;

            if (typeof result === 'string') {
                botResponse = { id: Date.now().toString(), sender: 'bot', text: result };
            } else {
                // It's an AiAction
                const confirmationText = onAction(result);
                botResponse = { id: Date.now().toString(), sender: 'system', text: confirmationText };
            }

            setMessages(prev => [...prev.filter(m => m.id !== 'loading'), botResponse]);

        } catch (error) {
            console.error('Error communicating with Gemini:', error);
            const errorMessage: ChatMessage = {
                id: Date.now().toString(),
                sender: 'bot',
                text: 'Lo siento, ocurrió un error al procesar tu solicitud.'
            };
            setMessages(prev => [...prev.filter(m => m.id !== 'loading'), errorMessage]);
        }
    };

    return (
        <>
            <button
                onClick={onToggle}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110 z-50"
                aria-label="Toggle Chatbot"
            >
                <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'} text-2xl`}></i>
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-md h-[70vh] max-h-[600px] bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-40 animate-fade-in-up">
                    <header className="bg-slate-900 p-4 rounded-t-2xl border-b border-slate-700">
                        <h3 className="font-bold text-white text-lg">Asistente IA</h3>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-lg max-w-xs md:max-w-sm lg:max-w-md ${
                                    msg.sender === 'user' ? 'bg-indigo-600 text-white' :
                                    msg.sender === 'system' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-200'
                                }`}>
                                    {msg.isLoading ? (
                                        <div className="flex items-center space-x-2">
                                           <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                           <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                                           <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                                        </div>
                                    ) : (
                                        <Markdown className="prose prose-invert prose-sm">
                                            {msg.text}
                                        </Markdown>
                                    )}
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-slate-700">
                        <div className="flex items-center bg-slate-700 rounded-lg">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribe un comando..."
                                className="flex-1 bg-transparent p-3 text-white placeholder-slate-400 focus:outline-none"
                            />
                            <button onClick={handleSend} className="p-3 text-indigo-400 hover:text-indigo-300">
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
