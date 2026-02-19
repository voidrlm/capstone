import jwt from "jsonwebtoken";

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: string;
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] | undefined;

function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return jwtSecret;
}

export function signAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: jwtExpiresIn,
  });
}

export function verifyAccessToken(token: string): JwtUserPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
  return {
    sub: String(decoded.sub),
    email: String(decoded.email),
    role: String(decoded.role),
  };
}
