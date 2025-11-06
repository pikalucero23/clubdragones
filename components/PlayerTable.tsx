
import React from 'react';
import { Player, PaymentMethod } from '../types';
import { MONTHS } from '../constants';

interface PlayerTableProps {
    players: Player[];
}

const PaymentStatusIcon: React.FC<{ paid: boolean; method: PaymentMethod }> = ({ paid, method }) => {
    if (!paid) {
        return <span title="Pendiente" className="text-red-400"><i className="fas fa-times-circle"></i></span>;
    }
    if (method === PaymentMethod.Cash) {
        return <span title="Pagado (Efectivo)" className="text-green-400"><i className="fas fa-money-bill-wave"></i></span>;
    }
    if (method === PaymentMethod.Transfer) {
        return <span title="Pagado (Transferencia)" className="text-blue-400"><i className="fas fa-exchange-alt"></i></span>;
    }
    return <span title="Pagado" className="text-green-400"><i className="fas fa-check-circle"></i></span>;
};

const PlayerTable: React.FC<PlayerTableProps> = ({ players }) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth() -1; // -1 because MONTHS starts at Feb

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
                <thead className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                    <tr>
                        <th className="p-3">Jugador</th>
                        {MONTHS.map(month => (
                            <th key={month} className="p-3 text-center">{month.substring(0, 3)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {players.map(player => {
                        const playerJoinMonthIndex = player.joinDate.getFullYear() === currentYear ? player.joinDate.getMonth() -1 : -1;
                        
                        return (
                            <tr key={player.id} className="hover:bg-slate-700/50">
                                <td className="p-3 font-medium text-white whitespace-nowrap">{player.name}</td>
                                {MONTHS.map((month, index) => {
                                    const payment = player.payments.find(p => p.month === month);
                                    
                                    // Player joined after this month, or this is a future month
                                    const isDisabled = index < playerJoinMonthIndex || index > currentMonthIndex;

                                    return (
                                        <td key={`${player.id}-${month}`} className="p-3 text-center">
                                            {isDisabled ? (
                                                <span className="text-slate-600">-</span>
                                            ) : payment ? (
                                                <PaymentStatusIcon paid={payment.paid} method={payment.method} />
                                            ) : (
                                                <span title="Error" className="text-yellow-400">?</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PlayerTable;
