import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { AppData, AiAction, FunctionName, PaymentMethod } from '../types';
import { MONTHS, MONTHLY_FEE } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const addMultiplePlayersTool: FunctionDeclaration = {
    name: FunctionName.addMultiplePlayers,
    description: "Agrega uno o varios jugadores nuevos al club.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            playerNames: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Un array con los nombres de los jugadores a agregar."
            }
        },
        required: ["playerNames"]
    }
};

const registerMultiplePaymentsTool: FunctionDeclaration = {
    name: FunctionName.registerMultiplePayments,
    description: "Registra el pago de la cuota mensual para uno o varios jugadores.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            playerNames: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array con los nombres de los jugadores que pagaron. Deben existir en la lista de jugadores."
            },
            month: {
                type: Type.STRING,
                description: `El mes que se pagó. Debe ser uno de: ${MONTHS.join(', ')}.`
            },
            method: {
                type: Type.STRING,
                description: "El método de pago.",
                enum: [PaymentMethod.Cash, PaymentMethod.Transfer]
            }
        },
        required: ["playerNames", "month", "method"]
    }
};

const generateMonthlyReportTool: FunctionDeclaration = {
    name: FunctionName.generateMonthlyReport,
    description: "Genera un informe detallado del estado financiero del mes actual.",
    parameters: {
        type: Type.OBJECT,
        properties: {}
    }
};

const deletePlayerTool: FunctionDeclaration = {
    name: FunctionName.deletePlayer,
    description: "Elimina a un jugador del club de forma permanente. Esta acción no se puede deshacer.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            playerName: {
                type: Type.STRING,
                description: "El nombre exacto del jugador a eliminar. Debe existir en la lista de jugadores."
            }
        },
        required: ["playerName"]
    }
};

const tools = [{
    functionDeclarations: [
        addMultiplePlayersTool,
        registerMultiplePaymentsTool,
        generateMonthlyReportTool,
        deletePlayerTool,
    ]
}];

export const runChat = async (prompt: string, contextData: AppData): Promise<string | AiAction> => {
    
    const today = new Date();
    const currentMonthIndex = today.getMonth() - 1; // -1 as MONTHS starts with Feb
    const currentMonthName = currentMonthIndex >= 0 ? MONTHS[currentMonthIndex] : "Febrero";
    
    const playersContext = contextData.players.map(p => ({
        name: p.name,
        paid_current_month: p.payments.find(payment => payment.month === currentMonthName)?.paid || false
    }));

    const systemInstruction = `
        Eres un asistente experto en IA para la gestión financiera de un club de fútbol.
        Tu objetivo es comprender las solicitudes en lenguaje natural del usuario y traducirlas en una de las llamadas a funciones de herramienta disponibles.
        
        REGLAS ESTRICTAS:
        - Sé siempre amable y confirma las acciones que realizas o vas a realizar.
        - Si una solicitud es ambigua (por ejemplo, "marcar el pago de Juan" sin especificar el mes), pide una aclaración.
        - No inventes nombres de jugadores ni meses. Utiliza únicamente los datos proporcionados en el contexto.
        - El mes actual es ${currentMonthName}. Asume que cualquier mención de "este mes" o "el mes actual" se refiere a ${currentMonthName}.
        - La cuota mensual es de ${MONTHLY_FEE} ARS.
        - Si te preguntan "¿quién falta pagar?" o similar, utiliza el contexto de jugadores para responder de forma clara y concisa.
        - Si la solicitud del usuario no coincide con ninguna función, responde de forma conversacional y útil.

        CONTEXTO ACTUAL DEL SISTEMA:
        - Fecha de hoy: ${today.toLocaleDateString('es-ES')}
        - Mes actual de referencia: ${currentMonthName}
        - Estado de los jugadores:
        ${JSON.stringify(playersContext, null, 2)}
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            systemInstruction,
            tools,
        }
    });

    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        console.log("Gemini Function Call:", call);
        return {
            name: call.name as FunctionName,
            args: call.args,
        };
    } else {
        return response.text;
    }
};