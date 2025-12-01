import express from "express";
import Participant from "../models/Participant.js";
import Ticket from "../models/Ticket.js";
import { upload } from "../config/cloudinary.js";
import { ImageAnnotatorClient } from "@google-cloud/vision";

const router = express.Router();
const visionClient = new ImageAnnotatorClient();

// Función OCR
async function isComprobanteValid(fileUrl) {
    try {
        const [result] = await visionClient.textDetection(fileUrl);
        const detections = result.textAnnotations;
        if (!detections || detections.length === 0) return false;

        const fullText = detections[0].description.toUpperCase();
        const hasAmount = fullText.includes("S/ 10.00") || fullText.includes("10.00");
        const hasSecurityCode = fullText.includes("CÓDIGO DE SEGURIDAD") || fullText.includes("CODIGO SEGURIDAD");
        const hasOperationNumber = fullText.includes("NRO. DE OPERACIÓN") || fullText.includes("NRO OPERACION") || fullText.includes("N° OPERACIÓN");

        return hasAmount && hasSecurityCode && hasOperationNumber;
    } catch (err) {
        console.error("Error OCR:", err);
        return false;
    }
}

// POST /api/register
router.post("/", upload.single("comprobante"), async (req, res) => {
    try {
        console.log("BODY:", req.body);
        console.log("FILE:", req.file);

        const { dni, whatsapp, departamento, nroOperacion } = req.body;

        // 1. VALIDAR CAMPOS ANTES DE SUBIR A CLOUDINARY
        if (!dni || dni.length !== 8) {
            return res.status(400).json({ success: false, message: "DNI inválido" });
        }

        if (!whatsapp || whatsapp.length < 9) {
            return res.status(400).json({ success: false, message: "WhatsApp inválido" });
        }

        if (!departamento) {
            return res.status(400).json({ success: false, message: "Departamento requerido" });
        }

        if (!nroOperacion || nroOperacion.length < 5) {
            return res.status(400).json({ success: false, message: "Número de operación inválido" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Debe subir el comprobante" });
        }

        // 2. SI TODO ES VÁLIDO → RECIÉN AQUÍ SUBIR A CLOUDINARY
        const result = await cloudinary.uploader.upload(req.file.path);
        const comprobanteUrl = result.secure_url;

        // 3. GUARDAR EN DB
        /*
        await Participant.create({
            dni,
            whatsapp,
            departamento,
            nroOperacion,
            comprobante: comprobanteUrl,
        });
        */

        return res.json({ success: true, message: "Registro guardado", comprobanteUrl });

    } catch (error) {
        console.error("ERROR:", error);
        return res.status(500).json({ success: false, message: "Error del servidor" });
    }
});


export default router;
