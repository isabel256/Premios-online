const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
    number: { type: Number, required: true },
    prize: { type: String, required: true },
    status: { type: String, default: 'Pendiente' },
    drawDate: { type: Date },
    prizeImage: { type: String }
});

module.exports = mongoose.model('Ticket', TicketSchema);
