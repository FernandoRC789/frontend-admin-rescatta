import { api } from "./client";
import type { ApiResponse, PageResponse, ReportDetail, ReportStats, ReportStatus, ReportSummary, Species } from "../types";

export interface InboxFilters {
  status?: ReportStatus;
  species?: Species;
  onlyMine?: boolean;
  page?: number;
  size?: number;
}

export async function fetchAdminInbox(filters: InboxFilters): Promise<PageResponse<ReportSummary>> {
  const { data } = await api.get<ApiResponse<PageResponse<ReportSummary>>>("/api/v1/admin/reports", {
    params: {
      status: filters.status,
      species: filters.species,
      onlyMine: filters.onlyMine ?? false,
      page: filters.page ?? 0,
      size: filters.size ?? 20,
      sort: "createdAt,desc",
    },
  });
  return data.data;
}

export async function fetchAdminReportDetail(id: number): Promise<ReportDetail> {
  const { data } = await api.get<ApiResponse<ReportDetail>>(`/api/v1/admin/reports/${id}`);
  return data.data;
}

export async function updateReportStatus(
  id: number,
  status: ReportStatus,
  rejectionReason?: string,
  adminNotes?: string
): Promise<ReportDetail> {
  const { data } = await api.patch<ApiResponse<ReportDetail>>(`/api/v1/admin/reports/${id}/status`, {
    status,
    rejectionReason,
    adminNotes,
  });
  return data.data;
}

export async function fetchAdminStats(): Promise<ReportStats> {
  const { data } = await api.get<ApiResponse<ReportStats>>("/api/v1/admin/reports/stats");
  return data.data;
}
