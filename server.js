import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import registerRoutes from "./routes/register.js";
import ticketsRoutes from "./routes/Tickets.js";
import dniRoutes from "./routes/validateDni.js";

dotenv.config();

const app = express();

// 📌 Necesarios para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// 📌 Primero las rutas API (MUY IMPORTANTE)
app.use("/api/register", registerRoutes);
app.use("/api/Tickets", ticketsRoutes);
app.use("/api/dni", dniRoutes);

// 📌 Archivos estáticos del frontend
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// 📌 Página principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "premios_davi.html"));
});

// 📌 Maneja cualquier ruta desconocida (SPA)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "premios_davi.html"));
});

// 📌 Conexión MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error(err));

// 📌 Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
