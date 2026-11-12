import axios from "axios";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { API_BASE_URL } from "../lib/env";

export class ApiError extends Error {
  readonly status?: number;
  readonly fieldErrors?: unknown;

  constructor(message: string, status?: number, fieldErrors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Adjunta el ID Token de Firebase vigente a cada request — es lo que el backend
// verifica en FirebaseAuthenticationFilter para saber quién eres.
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined;
    const fieldErrors = error?.response?.data?.fieldErrors;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Ocurrió un error inesperado.";

    if (status === 401) {
      try {
        await signOut(auth);
      } catch {
        // Si Firebase también falla, igualmente se rechaza la petición.
      }

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(new ApiError(message, status, fieldErrors));
  }
);
