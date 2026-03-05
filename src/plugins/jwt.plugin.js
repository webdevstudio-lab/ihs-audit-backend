import { jwt } from "@elysiajs/jwt";
import { ENV } from "../config/env.js";

export const jwtPlugin = jwt({
  name: "jwt",
  secret: ENV.JWT_SECRET,
});
