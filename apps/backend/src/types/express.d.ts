declare namespace Express {
  interface Request {
    user?: {
      id: string;
      name: string;
      email: string;
      image?: string | null | undefined;
    };
    session?: {
      id: string;
      userId: string;
      expiresAt: Date;
    };
  }
}
