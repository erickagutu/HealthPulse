import * as admin from "firebase-admin";

let app: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (app) return app;

  const serviceAccountJson = process.env["FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON"];
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON env var is missing");
  }

  const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return app;
}

export function getFirestore(): admin.firestore.Firestore {
  return getFirebaseAdmin().firestore();
}
