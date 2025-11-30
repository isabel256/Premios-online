import express from "express";
import Participant from "../models/Participant.js";
import Ticket from "../models/Ticket.js";

const router = express.Router();

// GET /api/tickets?dni=XXXXXXXX
router.get("/", async (req, res) => {
    const { dni } = req.query;
    if (!dni) return res.status(400).json({ success: false, message: "DNI requerido" });

    try {
        // Aquí 'tickets' ya contiene la info completa, incluyendo nroOperacion y comprobantePath
        const participant = await Participant.findOne({ dni }).populate("tickets");
        if (!participant) return res.json({ success: false, message: "DNI no encontrado", tickets: [] });

        res.json({
            success: true,
            name: participant.nombres + " " + participant.apellidos,
            tickets: participant.tickets // Esto incluye nroOperacion y comprobantePath
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error del servidor", tickets: [] });
    }
});

export default router;
