import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase-admin";
import { isAuthenticatedMode } from "@/lib/access-mode";

export const SESSION_COOKIE_NAME = "dadam_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type UserRole = "admin" | "user";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthenticatedSession {
  user: AppUser;
  sessionCookie: string;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const emailIndexId = (email: string) =>
  createHash("sha256").update(normalizeEmail(email)).digest("hex");

function isUserRole(role: unknown): role is UserRole {
  return role === "admin" || role === "user";
}

function getDisplayName(name: unknown, email: string) {
  if (typeof name === "string" && name.trim()) return name.trim().slice(0, 80);
  return email.split("@")[0] || "Pengguna";
}

async function ensureUserProfile(uid: string, email: string, name?: string): Promise<AppUser> {
  const userRef = firestore.collection("users").doc(uid);
  const legacyEmailRef = firestore.collection("userEmails").doc(emailIndexId(email));

  return firestore.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    if (userSnapshot.exists) {
      const user = userSnapshot.data();
      if (
        !isUserRole(user?.role) ||
        typeof user.email !== "string" ||
        normalizeEmail(user.email) !== email
      ) {
        throw new Error("Firebase profile is invalid");
      }

      return {
        uid,
        name: getDisplayName(user.name, email),
        email,
        role: user.role,
      };
    }

    const emailIndexSnapshot = await transaction.get(legacyEmailRef);
    const legacyUid = emailIndexSnapshot.data()?.uid;
    const legacyUserRef =
      typeof legacyUid === "string" && legacyUid !== uid
        ? firestore.collection("users").doc(legacyUid)
        : null;
    const legacyUserSnapshot = legacyUserRef
      ? await transaction.get(legacyUserRef)
      : null;
    const legacyUser = legacyUserSnapshot?.data();
    const matchingLegacyUser =
      legacyUser &&
      typeof legacyUser.email === "string" &&
      normalizeEmail(legacyUser.email) === email
        ? legacyUser
        : undefined;

    const role: UserRole = isUserRole(matchingLegacyUser?.role)
      ? matchingLegacyUser.role
      : "user";
    const displayName = getDisplayName(
      matchingLegacyUser?.name ?? name,
      email,
    );

    transaction.create(userRef, {
      name: displayName,
      email,
      role,
      authProvider: "firebase",
      createdAt: matchingLegacyUser?.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (legacyUserRef && legacyUserSnapshot?.exists && matchingLegacyUser) {
      transaction.update(legacyUserRef, {
        migratedTo: uid,
        passwordSalt: FieldValue.delete(),
        passwordHash: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(legacyEmailRef, {
        migratedTo: uid,
        migratedAt: FieldValue.serverTimestamp(),
      });
    }

    return { uid, name: displayName, email, role };
  });
}

export async function createAuthenticatedSession(
  idToken: string,
  name?: string,
): Promise<AuthenticatedSession> {
  const decodedToken = await firebaseAuth.verifyIdToken(idToken, true);
  if (typeof decodedToken.email !== "string" || !decodedToken.email.trim()) {
    throw new Error("Firebase account must have an email address");
  }
  if (decodedToken.email_verified !== true) {
    const verificationError = new Error("Firebase account email is not verified") as Error & {
      code: string;
    };
    verificationError.code = "auth/email-not-verified";
    throw verificationError;
  }

  const email = normalizeEmail(decodedToken.email);
  const user = await ensureUserProfile(decodedToken.uid, email, name ?? decodedToken.name);
  const sessionCookie = await firebaseAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_SECONDS * 1000,
  });

  return { user, sessionCookie };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decodedSession = await firebaseAuth.verifySessionCookie(sessionCookie, true);
    const userSnapshot = await firestore.collection("users").doc(decodedSession.uid).get();
    if (!userSnapshot.exists) return null;

    const user = userSnapshot.data();
    if (
      user?.authProvider !== "firebase" ||
      !isUserRole(user.role) ||
      typeof user.email !== "string" ||
      typeof user.name !== "string"
    ) {
      return null;
    }

    if (!isAuthenticatedMode() && user.role !== "admin") return null;

    return {
      uid: userSnapshot.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function getDashboardUser(): Promise<AppUser | null> {
  const user = await getCurrentUser();
  if (isAuthenticatedMode() && !user) redirect("/auth");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  if (user.role !== "admin") redirect("/summary");
  return user;
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;

  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol ?? new URL(request.url).protocol.replace(":", "");

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host && originUrl.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}
