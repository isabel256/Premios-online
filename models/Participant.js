import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true },
  nombres: { type: String, required: true },
  apellidos: { type: String, required: true },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }]
});

export default mongoose.model("Participant", participantSchema);
