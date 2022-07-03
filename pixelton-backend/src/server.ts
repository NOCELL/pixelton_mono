import mongoose from "mongoose"; // Require the framework and instantiate it
import Fastify from "fastify";

import methods from "./api/methods";
import { BasicApiResponse } from "./api/types";
import { ResponseErrorMethodNotFound } from "./api/errors";

const listOfMethods = Object.keys(methods);

const PORT = (process.env.PORT || 4000) as number;
const isProduction = process.env.NODE_ENV === "production";

const MONGO_URL_ACCESS = process.env.PROD
  ? null
  : "mongodb://127.0.0.1:27017/ton";

const server = Fastify({ logger: process.env.NODE_ENV !== "production" });

// Declare a route
server.all(
  "/api",
  async (request: any, reply: any): Promise<BasicApiResponse> => {
    try {
      if (isProduction === false) {
        console.log("request.query", request.query);
        console.log("request.headers", request.headers);
        console.log("request.body", request.body);
      }

      const { body = {} } = request;

      if (listOfMethods.includes(body.method) === false) {
        return ResponseErrorMethodNotFound;
      }

      switch (body.method) {
        case "load_canvas":
          return await methods.load_canvas(request, reply);
        case "get_info_for_channel":
          return await methods.get_info_for_channel(request, reply);
        case "topup":
          return await methods.topup(request, reply);
        case "paint_pixel":
          return await methods.paint_pixel(request, reply);
        default:
          return ResponseErrorMethodNotFound;
      }

      return {
        success: false,
      };
    } catch (e) {
      console.log(e);
      console.log(e.stack);
      debugger;
    }
  }
);

async function main() {
  await mongoose.connect(MONGO_URL_ACCESS);
  try {
    await server.listen({ port: PORT });
    console.log("Server started on port " + PORT);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main().catch((err) => console.log(err));
