import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const isDev = process.env.NODE_ENV !== "production";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-user-usn",
    ],
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  if (!isDev) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use("/api", router);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ app: "JCETHub API", status: "running", version: "1.0.0" });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: "error", message: "Not found" });
});

export default app;
