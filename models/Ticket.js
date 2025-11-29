import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  dni: { type: String, required: true },
  nombre: { type: String, required: true },
  numeroTicket: { type: String, required: true },
  comprobante: { type: String },
  fecha: { type: Date, default: Date.now }
});

// 👇 ESTA LÍNEA ES LA QUE TE FALTABA
export default mongoose.model("Ticket", ticketSchema);
