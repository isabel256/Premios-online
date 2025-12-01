import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true },
  nombres: { type: String },
  apellidos: { type: String },
  whatsapp: { type: String },
  departamento: { type: String },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
});

export default mongoose.model("Participant", participantSchema);
