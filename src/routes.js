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
    const arr = req.body;
    const result = await insertRow(arr);
    res.json({ result });
  } catch (error) {
    res.json({ error: error.message });
  }
});

export default router;
