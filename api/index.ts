import express from "express";
import cors from "cors";
import soundcloudRouter from "./soundcloud-routes";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/healthz", (_req, res) => { res.json({ status: "ok" }); });
app.use("/api/soundcloud", soundcloudRouter);

export default app;
