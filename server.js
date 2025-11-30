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

// 📌 Necesarios para trabajar con __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📌 Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

app.use(cors());
app.use(express.json());

// 📌 RUTA PRINCIPAL → Mostrar premios_davi.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "premios_davi.html"));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error(err));

// Rutas API
app.use("/api/register", registerRoutes);
app.use("/api/Tickets", ticketsRoutes);
app.use("/api/dni", dniRoutes);

// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
