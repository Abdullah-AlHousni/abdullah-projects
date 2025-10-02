import { verifyToken } from "./jwt";

export const tryGetViewerId = (authorization?: string | string[]) => {
  if (!authorization) {
    return undefined;
  }

  const tokenHeader = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!tokenHeader?.startsWith("Bearer ")) {
    return undefined;
  }

  const token = tokenHeader.split(" ")[1];

  try {
    const decoded = verifyToken<{ userId: string }>(token);
    return decoded.userId;
  } catch (error) {
    console.warn("Unable to parse viewer token", error);
    return undefined;
  }
};

export default tryGetViewerId;
