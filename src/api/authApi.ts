import { api } from "./client";
import type { AppUserResponse, ApiResponse } from "../types";

export async function fetchMe(): Promise<AppUserResponse> {
  const { data } = await api.get<ApiResponse<AppUserResponse>>("/api/v1/auth/me");
  return data.data;
}
