import { env, socialProviders } from "better-auth";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";

export const createAuth = () => {
  return betterAuth({
    database: mongodbAdapter(mongoose.connection.db!),

    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
  google: {
    clientId: env.GOOGLE_CLIENT_ID!,
    clientSecret: env.GOOGLE_CLIENT_SECRET!,
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID!,
    clientSecret: env.GITHUB_CLIENT_SECRET!,
  },
},

    trustedOrigins: [process.env.CLIENT_URL!, "http://localhost:5173"],

    secret: process.env.BETTER_AUTH_SECRET!,

    baseURL: process.env.BETTER_AUTH_URL!,
  });
};
