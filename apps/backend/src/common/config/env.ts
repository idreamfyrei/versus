import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 8000,
  MONGO_URI: process.env.MONGO_URI!,
  CLIENT_URL: process.env.CLIENT_URL!,
  NODE_ENV: process.env.NODE_ENV!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID!,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET!,
};
