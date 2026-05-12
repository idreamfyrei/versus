function globalErrorHandler(
  err: Error,
  _req: any,
  res: any,
  _next: any,
) {
  console.error("Global Error Handler:", err);
  res.status(500).json({
    error: "An unexpected error occurred.",
    message: err.message,
  });
}

export { globalErrorHandler };