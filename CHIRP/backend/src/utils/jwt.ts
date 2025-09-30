import jwt from "jsonwebtoken";
import env from "../config/env";

export const signToken = (userId: string) =>
  jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = <T>(token: string) => jwt.verify(token, env.JWT_SECRET) as T;

export default {
  signToken,
  verifyToken,
};
