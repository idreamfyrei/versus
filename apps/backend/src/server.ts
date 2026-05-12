import http from "http";

import app from "./app.js";

import { connectDB } from "./common/database/mongoose.js";
import { env } from "./common/config/env.js";

import { createAuth } from "./common/config/auth.js";
import { toNodeHandler } from "better-auth/node";

const startServer = async () => {
  await connectDB();

  const auth = createAuth();

  app.all("/api/auth/{*any}", toNodeHandler(auth));

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

startServer();
