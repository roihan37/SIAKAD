import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import router from "./router/index";
import { errorHandler } from "./middleware/errHendler";
import "dotenv/config";

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(router)

app.use(errorHandler)

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});