import express from "express";
import { generateResponse, insertRow } from "./controllers.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { q: question } = req.query;
    const response = await generateResponse(question);
    res.json(response);
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const obj = req.body;
    const result = await insertRow(obj);
    res.json({ result });
  } catch (error) {
    res.json({ error: error.message });
  }
});

export default router;
