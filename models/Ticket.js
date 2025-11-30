// Ticket.js - Modelo Mejorado con Antifraude
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    // Referencia al participante
    participant: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Participant", 
        required: true 
    },
    
    // El número de ticket único generado para el sorteo
    numeroTicket: { 
        type: String, 
        required: true, 
        unique: true // 👈 CLAVE 1: El código de sorteo no puede repetirse
    },
    
    // El número de operación que se valida con el OCR
    nroOperacion: { 
        type: String, 
        required: true, 
        unique: true // 👈 CLAVE 2: EL ANTIFRAUDE PRINCIPAL. Un comprobante (Nro. Op.) solo se usa una vez
    },
    
    // Ruta donde se guarda el archivo del comprobante
    comprobantePath: { 
        type: String, 
        required: true 
    },

    fecha: { 
        type: Date, 
        default: Date.now 
    }
});

// Nota: Eliminamos 'dni' y 'nombre' ya que se obtienen desde la referencia 'participant'

export default mongoose.model("Ticket", ticketSchema);
