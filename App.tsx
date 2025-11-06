import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppData, Player, Payment, PaymentMethod, AiAction, FunctionName } from './types';
import Dashboard from './components/Dashboard';
import Chatbot from './components/Chatbot';
import { MONTHS } from './constants';

// Initial data for demonstration purposes
const getInitialData = (): AppData => {
    const today = new Date();
    return {
        players: [
            {
                id: '1', name: 'Darío', joinDate: new Date(today.getFullYear(), 1, 15), 
                payments: MONTHS.map((month, i) => ({ month, year: today.getFullYear(), method: PaymentMethod.Unknown, paid: i < today.getMonth() - 2 }))
            },
            { 
                id: '2', name: 'Lucas', joinDate: new Date(today.getFullYear(), 3, 5), 
                payments: MONTHS.map((month, i) => ({ month, year: today.getFullYear(), method: PaymentMethod.Unknown, paid: i < today.getMonth() - 2 }))
            },
            {
                id: '3', name: 'Juan', joinDate: new Date(),
                payments: MONTHS.map((month, i) => ({ month, year: today.getFullYear(), method: PaymentMethod.Unknown, paid: false }))
            },
        ]
    };
};


const App: React.FC = () => {
    const [data, setData] = useState<AppData>(() => {
        try {
            const storedData = localStorage.getItem('clubFinanceData');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                // Dates need to be reconstructed
                parsedData.players.forEach((p: Player) => {
                    p.joinDate = new Date(p.joinDate);
                });
                return parsedData;
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
        return getInitialData();
    });

    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem('clubFinanceData', JSON.stringify(data));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }, [data]);
    
    const today = useMemo(() => new Date(), []);
    const currentMonthIndex = today.getMonth() -1; // -1 because MONTHS array starts with Feb
    const currentMonthName = currentMonthIndex >= 0 ? MONTHS[currentMonthIndex] : "Febrero";


    const addPlayers = useCallback((playerNames: string[]): string => {
        const newPlayers: Player[] = playerNames.map(name => ({
            id: new Date().getTime().toString() + Math.random(),
            name,
            joinDate: new Date(),
            payments: MONTHS.map(month => ({
                month,
                year: today.getFullYear(),
                method: PaymentMethod.Unknown,
                paid: false
            }))
        }));

        setData(prevData => ({
            ...prevData,
            players: [...prevData.players, ...newPlayers]
        }));
        return `Se agregaron ${playerNames.length} jugadores: ${playerNames.join(', ')}.`;
    }, [today]);

    const registerPayments = useCallback((playerNames: string[], month: string, method: PaymentMethod): string => {
        const updatedPlayers = data.players.map(player => {
            if (playerNames.some(name => name.toLowerCase() === player.name.toLowerCase())) {
                const updatedPayments = player.payments.map(p => {
                    if (p.month.toLowerCase() === month.toLowerCase()) {
                        return { ...p, paid: true, method };
                    }
                    return p;
                });
                return { ...player, payments: updatedPayments };
            }
            return player;
        });

        setData({ ...data, players: updatedPlayers });
        return `Se registraron los pagos de ${playerNames.join(', ')} para ${month} por ${method}.`;
    }, [data]);
    
    const generateMonthlyReport = useCallback((): string => {
        const paidPlayers = data.players
            .filter(p => p.payments.find(payment => payment.month === currentMonthName && payment.paid))
            .map(p => {
                const payment = p.payments.find(pay => pay.month === currentMonthName)!;
                return `${p.name} (${payment.method})`;
            });
        
        const unpaidPlayers = data.players
            .filter(p => !p.payments.find(payment => payment.month === currentMonthName && payment.paid))
            .map(p => p.name);

        const cashTotal = data.players
            .flatMap(p => p.payments)
            .filter(p => p.month === currentMonthName && p.paid && p.method === PaymentMethod.Cash)
            .length;
            
        const transferTotal = data.players
            .flatMap(p => p.payments)
            .filter(p => p.month === currentMonthName && p.paid && p.method === PaymentMethod.Transfer)
            .length;

        let report = `**Informe de ${currentMonthName}**\n\n`;
        report += `**Pagaron (${paidPlayers.length}):**\n${paidPlayers.join('\n') || 'Nadie'}\n\n`;
        report += `**No Pagaron (${unpaidPlayers.length}):**\n${unpaidPlayers.join('\n') || 'Nadie'}\n\n`;
        report += `**Totales:**\n`;
        report += `- Efectivo: ${cashTotal} pagos\n`;
        report += `- Transferencia: ${transferTotal} pagos\n`;

        return report;
    }, [data.players, currentMonthName]);

    const deletePlayer = useCallback((playerName: string): string => {
        let playerFound = false;
        const updatedPlayers = data.players.filter(player => {
            if (player.name.toLowerCase() === playerName.toLowerCase()) {
                playerFound = true;
                return false; // Exclude this player
            }
            return true; // Keep this player
        });

        if (!playerFound) {
            return `No se encontró al jugador llamado "${playerName}". Intenta con un nombre de la lista.`;
        }

        setData(prevData => ({
            ...prevData,
            players: updatedPlayers
        }));

        return `Se eliminó a ${playerName} del club.`;
    }, [data.players]);

    const handleAiAction = (action: AiAction): string => {
        switch (action.name) {
            case FunctionName.addMultiplePlayers:
                return addPlayers(action.args.playerNames);
            case FunctionName.registerMultiplePayments:
                return registerPayments(action.args.playerNames, action.args.month, action.args.method);
            case FunctionName.generateMonthlyReport:
                 return generateMonthlyReport();
            case FunctionName.deletePlayer:
                 return deletePlayer(action.args.playerName);
            default:
                return "Acción no reconocida.";
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
            <Dashboard 
              data={data} 
              currentMonthName={currentMonthName}
            />
            <Chatbot
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
                onAction={handleAiAction}
                contextData={data}
            />
        </div>
    );
};

export default App;