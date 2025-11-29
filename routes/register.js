import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import Participant from "../models/Participant.js";
import Ticket from "../models/Ticket.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de multer para subir comprobantes
import multer from "multer";
import { storage } from "../config/cloudinary.js";
const upload = multer({ storage });


// POST /api/register
router.post("/", upload.single("comprobante"), async (req, res) => {
    const { dni } = req.body;

    if (!dni || dni.length !== 8) return res.status(400).json({ success: false, message: "DNI inválido" });

    try {
        // Validar DNI con API Perú
        const token = process.env.API_TOKEN;
        const response = await fetch(`https://apiperu.dev/api/dni/${dni}?api_token=${token}`);
        const data = await response.json();

        if (!data.success) return res.status(400).json({ success: false, message: "DNI no válido o no encontrado" });

        // Verificar si ya existe el participante
        let participant = await Participant.findOne({ dni });
        if (!participant) {
            participant = new Participant({
                dni,
                nombres: data.data.nombres,
                apellidos: data.data.apellido_paterno + " " + data.data.apellido_materno
            });
            await participant.save();
        }

        // Crear ticket
        const ticketNumber = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
        const ticket = new Ticket({
            number: ticketNumber,
            participant: participant._id,
            comprobante: req.file ? req.file.path : ""
        });

        await ticket.save();

        // Guardar referencia en participante
        participant.tickets.push(ticket._id);
        await participant.save();

        res.json({ success: true, ticket: ticketNumber });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error del servidor" });
    }
});

export default router;
