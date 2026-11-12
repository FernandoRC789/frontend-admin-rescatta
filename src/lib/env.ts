function required(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisa .env.example y configura el archivo .env antes de iniciar la aplicación.`
    );
  }
  return normalized;
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = withoutTrailingSlash(
  required("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL)
);

export const WS_URL = withoutTrailingSlash(
  required("VITE_WS_URL", import.meta.env.VITE_WS_URL)
);

export const FIREBASE_CONFIG = {
  apiKey: required("VITE_FIREBASE_API_KEY", import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: required("VITE_FIREBASE_AUTH_DOMAIN", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: required("VITE_FIREBASE_PROJECT_ID", import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: required("VITE_FIREBASE_STORAGE_BUCKET", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: required(
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: required("VITE_FIREBASE_APP_ID", import.meta.env.VITE_FIREBASE_APP_ID),
};
