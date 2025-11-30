// routes/register.js - CÓDIGO MEJORADO CON ANTIFRAUDE Y OCR
import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import Participant from "../models/Participant.js";
import Ticket from "../models/Ticket.js";
import { storage } from "../config/cloudinary.js"; // O tu configuración local
import { ImageAnnotatorClient } from '@google-cloud/vision'; // 1. Nueva dependencia para OCR
import fs from "fs"; // 2. Nueva dependencia para manejo de archivos locales/temporales

// --- Configuración Inicial ---
const router = express.Router();
const upload = multer({ storage });
const visionClient = new ImageAnnotatorClient(); // Inicializar cliente de Google Vision

// 3. FUNCIÓN DE VALIDACIÓN OCR (Antifraude)
/**
 * Valida el comprobante con Google Vision API.
 * Busca el monto 'S/ 10.00' y las frases clave.
 * @param {string} filePath - La ruta del archivo a escanear (local o URL).
 * @returns {boolean} - True si pasa la validación, false si no.
 */
const validateComprobanteWithOCR = async (filePath) => {
    try {
        const [result] = await visionClient.textDetection(filePath);
        const detections = result.textAnnotations;
        
        if (!detections || detections.length === 0) {
            console.log("OCR fallido: No se detectó texto en el comprobante.");
            return false;
        }

        const fullText = detections[0].description.toUpperCase();
        console.log("Texto OCR detectado:", fullText);

        // CHEQUEO 1: Monto (Variaciones comunes de S/ 10.00)
        const hasAmount = fullText.includes("S/ 10.00") || 
                          fullText.includes("S/. 10.00") || 
                          fullText.includes("10.00");

        // CHEQUEO 2: Frases clave (Garantía de ser un comprobante de transferencia bancaria)
        const hasSecurityCode = fullText.includes("CÓDIGO DE SEGURIDAD") || 
                                fullText.includes("CODIGO SEGURIDAD");
        const hasOperationNumber = fullText.includes("NRO. DE OPERACIÓN") || 
                                   fullText.includes("NRO OPERACION") ||
                                   fullText.includes("N° OPERACIÓN");

        if (!hasAmount) {
            console.log("OCR fallido: Monto S/ 10.00 no encontrado.");
            return false;
        }
        if (!hasSecurityCode || !hasOperationNumber) {
            console.log("OCR fallido: No se encontraron frases clave (Código de Seguridad o Nro. de Operación).");
            return false;
        }

        return true; // Pasa todas las validaciones críticas
    } catch (error) {
        console.error("Error al ejecutar OCR:", error);
        return false;
    }
};


// POST /api/register
router.post("/", upload.single("comprobante"), async (req, res) => {
    // Definimos el path para asegurar la limpieza en caso de error
    const comprobantePath = req.file ? req.file.secure_url: null; 
    
    try {
        const { dni, nroOperacion } = req.body; // 4. Capturamos nroOperacion manual

        // --- VALIDACIÓN DE DATOS DE ENTRADA ---
        if (!dni || dni.length !== 8 || isNaN(dni)) {
            return res.status(400).json({ success: false, message: "DNI inválido" });
        }
        if (!nroOperacion || nroOperacion.length < 5) {
            return res.status(400).json({ success: false, message: "Número de Operación inválido" });
        }
        if (!comprobantePath) {
             return res.status(400).json({ success: false, message: "Comprobante de pago no fue subido" });
        }

        // --- VALIDACIÓN OCR (Antifraude 1) ---
        const isComprobanteValid = await validateComprobanteWithOCR(comprobantePath);

        if (!isComprobanteValid) {
            // Limpieza: Si falla el OCR, borramos el archivo subido
            if (comprobantePath && comprobantePath.startsWith('/uploads')) {
                 fs.unlinkSync(comprobantePath); 
            }
            return res.status(400).json({ success: false, message: "Comprobante inválido o no legible por OCR. Asegúrese de que contenga el monto S/ 10.00 y los códigos de operación." });
        }


        // --- VALIDACIÓN DNI con API Perú ---
        const token = process.env.API_TOKEN;
        const response = await fetch(`https://apiperu.dev/api/dni/${dni}?api_token=${token}`);
        const data = await response.json();

        if (!data.success) {
             // Limpieza: Si falla DNI API, borramos el archivo subido
            if (comprobantePath && comprobantePath.startsWith('/uploads')) {
                 fs.unlinkSync(comprobantePath); 
            }
            return res.status(400).json({ success: false, message: "DNI no válido o no encontrado en el RENIEC." });
        }

        
        // --- CREACIÓN / VERIFICACIÓN DE PARTICIPANTE ---
        let participant = await Participant.findOne({ dni });
        if (!participant) {
            participant = new Participant({
                dni,
                nombres: data.data.nombres,
                apellidos: data.data.apellido_paterno + " " + data.data.apellido_materno,
                tickets: []
            });
            await participant.save();
        }

        // --- CREACIÓN Y VALIDACIÓN FINAL DEL TICKET (Antifraude 2) ---
        const ticketNumber = "DAV" + Math.floor(Math.random() * 100000).toString().padStart(5, "0"); 
        
        const newTicket = new Ticket({
            participant: participant._id,
            numeroTicket: ticketNumber,
            nroOperacion: nroOperacion, // Usamos el nro. operación manual
            comprobantePath: comprobantePath 
        });
        
        await newTicket.save();

        // Si el ticket se guarda exitosamente:
        
        // Guardar referencia en participante
        participant.tickets.push(newTicket._id);
        await participant.save();

        // Respuesta JSON segura
        res.json({ success: true, ticket: ticketNumber, message: "Registro exitoso. ¡Mucha suerte!" });

    } catch (error) {
        
        // Manejo de Error de Duplicado Mongoose (Antifraude 3)
        if (error.code && error.code === 11000) {
             // Limpieza: Error de clave única (nroOperacion o numeroTicket ya existen)
            if (comprobantePath && comprobantePath.startsWith('/uploads')) {
                 fs.unlinkSync(comprobantePath); 
            }
            return res.status(409).json({ success: false, message: "Error de duplicado. Este número de operación o DNI ya ha sido registrado." });
        }
        
        // Manejo de otros errores y limpieza
        console.error("Error catastrófico en /api/register:", error);
        if (comprobantePath && comprobantePath.startsWith('/uploads')) {
             fs.unlinkSync(comprobantePath); 
        }
        res.status(500).json({ success: false, message: "Error interno del servidor. Intente de nuevo más tarde." });
    }
});

export default router;