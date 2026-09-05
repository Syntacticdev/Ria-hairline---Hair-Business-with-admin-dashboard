import dotenv from "dotenv";
dotenv.config();

import { server } from "./app";
import { connectDB } from "./config/database";

const PORT = Number(process.env.PORT) || 5000;

const start = async (): Promise<void> => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Ria Hairline API running on http://localhost:${PORT}`);
    });

    // if (process.env.NODE_ENV !== "production") {
    //   const PORT = process.env.PORT || 5000;
    //   server.listen(PORT, () => {
    //     console.log(`Ria Hairline API running on http://localhost:${PORT}`);
    //   });
    // }
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

void start();
