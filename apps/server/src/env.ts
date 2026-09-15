export const serverEnv = {
  port: Number(process.env.PORT ?? 8787),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  openaiApiKey: process.env.OPENAI_API_KEY,
};
