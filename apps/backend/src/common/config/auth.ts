import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";
import { env } from "./env.js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

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
