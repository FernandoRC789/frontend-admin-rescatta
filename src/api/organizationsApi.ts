import { api } from "./client";
import type { ApiResponse, OrganizationResponse, PageResponse } from "../types";

export interface OrganizationUpdatePayload {
  name: string;
  type: string | null;
  description: string | null;
  address: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  scheduleText: string | null;
  emergency24h: boolean;
}

export async function fetchMyOrganization(): Promise<OrganizationResponse> {
  const { data } = await api.get<ApiResponse<OrganizationResponse>>("/api/v1/organizations/me");
  return data.data;
}

export async function updateMyOrganization(payload: OrganizationUpdatePayload): Promise<OrganizationResponse> {
  const { data } = await api.put<ApiResponse<OrganizationResponse>>("/api/v1/organizations/me", payload);
  return data.data;
}

export async function uploadMyOrganizationLogo(file: File): Promise<OrganizationResponse> {
  const form = new FormData();
  form.append("logo", file);
  const { data } = await api.post<ApiResponse<OrganizationResponse>>("/api/v1/organizations/me/logo", form);
  return data.data;
}

export async function fetchPendingOrganizations(page = 0): Promise<PageResponse<OrganizationResponse>> {
  const { data } = await api.get<ApiResponse<PageResponse<OrganizationResponse>>>(
    "/api/v1/superadmin/organizations/pending",
    { params: { page, size: 20 } }
  );
  return data.data;
}

export async function verifyOrganization(id: number, verified: boolean): Promise<OrganizationResponse> {
  const { data } = await api.patch<ApiResponse<OrganizationResponse>>(
    `/api/v1/superadmin/organizations/${id}/verify`,
    null,
    { params: { verified } }
  );
  return data.data;
}
