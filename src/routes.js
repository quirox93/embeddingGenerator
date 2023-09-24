import express from "express";
import { generateResponse, insertRow } from "./controllers.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { content } = req.query;
    const { response, matchs } = await generateResponse(content);
    res.json({ response, matchs });
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { content } = req.body;
    const data = await insertRow(content);
    res.json({ data });
  } catch (error) {
    res.json({ error: error.message });
  }
});

export default router;
