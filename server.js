import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import registerRoutes from "./routes/register.js";
import ticketsRoutes from "./routes/Tickets.js";
import dniRoutes from "./routes/validateDni.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.error(err));

app.use("/api/register", registerRoutes);
app.use("/api/Tickets", ticketsRoutes);
app.use("/api/dni", dniRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
