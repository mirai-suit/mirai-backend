import { PrismaClient } from "../../../prisma/generated";
import logger from "src/utils/logger";

// We are disabling the eslint rule here for a specific purpose. DO NOT REMOVE
// eslint-disable-next-line prefer-const
let prisma: PrismaClient = new PrismaClient();

// Make a query to the database to check if the connection is successful
// This will trigger an info log in the console
prisma
  .$connect()
  .then(() => {
    logger.info("Connected to the database");
  })
  .catch((error: Error) => {
    logger.error("Error connecting to the database: ", error);
  });

export default prisma;
