import app from "./app";
import env from "./config/env";
import prisma from "./config/prisma";

const port = env.PORT;

const start = async () => {
  try {
    await prisma.$connect();
    app.listen(port, () => {
      console.log(`🚀 Chirp backend ready at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
