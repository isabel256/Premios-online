import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import registerRoutes from "./routes/register.js";
import ticketsRoutes from "./routes/Tickets.js"; // cuidado con mayúsculas

dotenv.config();

const app = express();

// Para ES Modules: obtener __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir uploads y archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Conectar MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error(err));

// Rutas de la API
app.use("/api/register", registerRoutes);
app.use("/api/tickets", ticketsRoutes);

// Ruta raíz - HTML principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "premios_davi.html"));
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
