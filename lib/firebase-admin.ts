import "server-only";

import { getAuth } from "firebase-admin/auth";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminCredential() {
  const accountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!accountJson) return applicationDefault();

  let parsed: unknown;
  try {
    parsed = JSON.parse(accountJson);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain a service-account object.");
  }

  const account = parsed as Record<string, unknown>;
  const projectId = account.project_id ?? account.projectId;
  const clientEmail = account.client_email ?? account.clientEmail;
  const privateKey = account.private_key ?? account.privateKey;

  if (
    typeof projectId !== "string" ||
    typeof clientEmail !== "string" ||
    typeof privateKey !== "string"
  ) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON must include project_id, client_email, and private_key.",
    );
  }

  const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (configuredProjectId && projectId !== configuredProjectId) {
    throw new Error(
      "Firebase Admin service-account project_id does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
    );
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };

  return cert(serviceAccount);
}

const firebaseApp =
  getApps()[0] ??
  initializeApp({
    credential: getAdminCredential(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
