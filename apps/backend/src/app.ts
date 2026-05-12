import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// import { routes } from "./routes";

const app: Express = express();

app.use(
  cors({
    origin: "http://localhost:5173",
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

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});



// app.use("/api", routes);

export default app;
