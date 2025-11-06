
import React from 'react';
import { AppData } from '../types';
import PlayerTable from './PlayerTable';
import { MONTHLY_FEE } from '../constants';

interface DashboardProps {
  data: AppData;
  currentMonthName: string;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4">
        <div className={`text-3xl p-4 rounded-full ${color}`}>
            <i className={icon}></i>
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ data, currentMonthName }) => {
    const { players } = data;
    const totalPlayers = players.length;

    const currentMonthRevenue = players.filter(p => 
        p.payments.some(pay => pay.month === currentMonthName && pay.paid)
    ).length * MONTHLY_FEE;

    const annualRevenue = players.reduce((total, player) => {
        const paidMonths = player.payments.filter(p => p.paid).length;
        return total + (paidMonths * MONTHLY_FEE);
    }, 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="container mx-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Panel de Finanzas</h1>
                <p className="text-slate-400">Club de Fútbol | Resumen General</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Jugadores Totales" value={totalPlayers} icon="fas fa-users" color="bg-blue-500 text-white" />
                <StatCard title={`Recaudado ${currentMonthName}`} value={formatCurrency(currentMonthRevenue)} icon="fas fa-calendar-day" color="bg-green-500 text-white" />
                <StatCard title="Recaudado Anual" value={formatCurrency(annualRevenue)} icon="fas fa-chart-line" color="bg-indigo-500 text-white" />
            </div>

            <main className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Estado de Pagos - {new Date().getFullYear()}</h2>
                <PlayerTable players={players} />
            </main>
        </div>
    );
};

export default Dashboard;
