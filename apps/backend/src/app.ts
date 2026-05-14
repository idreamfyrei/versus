import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./common/config/env.js";
import { routes } from "./routes.js";
import { globalErrorHandler } from "./common/utils/response.js";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());

app.use(cookieParser());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api", routes);

app.use(globalErrorHandler);

export default app;
