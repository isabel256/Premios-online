import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/**
 * GET /api/dni/validate?dni=XXXXXXXX
 * Consulta el DNI con una API externa para validar su existencia y obtener el nombre.
 */
router.get("/validate", async (req, res) => {
    try {
        const { dni } = req.query;

        // 1. Validación básica de formato
        if (!dni || dni.length !== 8 || isNaN(dni)) {
            return res.status(400).json({ success: false, message: "DNI inválido. Debe contener 8 dígitos numéricos." });
        }

        const token = process.env.API_TOKEN;
        if (!token) {
            console.error("API_TOKEN no está configurado.");
            return res.status(500).json({ success: false, message: "Error de configuración en el servidor." });
        }
        
        // 2. Consultar API Perú
        const response = await fetch(`https://apiperu.dev/api/dni/${dni}?api_token=${token}`);
        const data = await response.json();

        if (data.success) {
            const nombreCompleto = `${data.data.nombres} ${data.data.apellido_paterno} ${data.data.apellido_materno}`;
            // 3. Respuesta exitosa
            res.json({
                success: true,
                dni: data.data.numero,
                name: nombreCompleto,
                message: "DNI validado exitosamente"
            });
        } else {
            // 4. DNI no encontrado o inválido por la API externa
            res.status(404).json({ success: false, message: data.message || "DNI no válido o no encontrado en el RENIEC." });
        }

    } catch (error) {
        console.error("Error al validar DNI:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor al validar DNI" });
    }
});

export default router;