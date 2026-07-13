import cors from "cors";
import express from "express";
import router from "./router/index";

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(router)

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});