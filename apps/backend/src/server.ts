import http from "http";

import app from "./app.js";

import { connectDB } from "./common/database/mongoose.js";
import { env } from "./common/config/env.js";

import { getAuth } from "./common/config/auth.js";
import { toNodeHandler } from "better-auth/node";
import { initSocket } from "./modules/socket/index.js";

const startServer = async () => {
  await connectDB();

  const auth = getAuth();

  // for ex 5 
  app.all("/api/auth/{*any}", toNodeHandler(auth!));

  const server = http.createServer(app);

  initSocket(server);

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

startServer();
