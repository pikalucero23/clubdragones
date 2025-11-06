export enum PaymentMethod {
  Cash = 'efectivo',
  Transfer = 'transferencia',
  Unknown = 'desconocido'
}

export interface Payment {
  month: string;
  year: number;
  method: PaymentMethod;
  paid: boolean;
}

export interface Player {
  id: string;
  name: string;
  joinDate: Date;
  payments: Payment[];
}

export interface AppData {
  players: Player[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  isLoading?: boolean;
}

export enum FunctionName {
    addMultiplePlayers = "addMultiplePlayers",
    registerMultiplePayments = "registerMultiplePayments",
    generateMonthlyReport = "generateMonthlyReport",
    deletePlayer = "deletePlayer",
}

export interface AiAction {
    name: FunctionName;
    args: any;
}