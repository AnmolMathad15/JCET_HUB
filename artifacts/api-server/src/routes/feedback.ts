import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/feedback", (req, res) => {
  const { category, subject, message, rating } = req.body;
  if (!category || !message) {
    res.status(400).json({ error: "bad_request", message: "Category and message are required" });
    return;
  }
  req.log?.info?.({ category, subject, rating }, "Feedback received");
  res.json({ success: true, message: "Thank you for your feedback! It has been submitted to the concerned department." });
});

export default router;
