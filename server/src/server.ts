import { clientOrigin, jwtSecret } from "./auth/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import router from "./router/index";
import { errorHandler } from "./middleware/errHendler";

jwtSecret(); // Auth configuration validates all application settings before listening.
const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
    // Allow the frontend to honor authentication rate-limit cooldowns across origins.
    exposedHeaders: ["Retry-After"],
  })
);
app.use(router)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});