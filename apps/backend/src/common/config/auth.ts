import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";
import { env } from "./env.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authInstance: any = null;

export const getAuth = () => {
  if (!authInstance) {
    authInstance = betterAuth({
      database: mongodbAdapter(mongoose.connection.db!),

      socialProviders: {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      },

      trustedOrigins: [env.CLIENT_URL],

      secret: env.BETTER_AUTH_SECRET,

      baseURL: env.BETTER_AUTH_URL,
    });
  }
  return authInstance;
};
