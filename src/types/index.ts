export type UserRole = "CIUDADANO" | "ADMINISTRADOR" | "SUPERADMIN";

export type ReportStatus = "PENDIENTE" | "APROBADO" | "EN_PROCESO" | "RESCATADO" | "RECHAZADO";

export type Species = "PERRO" | "GATO" | "OTRO";

export type ReportCondition =
  | "HERIDO" | "SANO" | "ATROPELLADO" | "PERDIDO" | "ABANDONADO" | "ENFERMO" | "REHABILITACION" | "OTROS";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AppUserResponse {
  id: number;
  uid: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  role: UserRole;
  organizationId: number | null;
  organizationName: string | null;
  organizationVerified: boolean;
}

export interface OrganizationResponse {
  id: number;
  name: string;
  type: string | null;
  verified: boolean;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  address: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  scheduleText: string | null;
  emergency24h: boolean;
  createdAt: string;
}

export interface ReportSummary {
  id: number;
  species: Species;
  condition: ReportCondition;
  status: ReportStatus;
  address: string | null;
  coverPhotoUrl: string | null;
  distanceKm: number | null;
  createdAt: string;
}

export interface ReportDetail {
  id: number;
  species: Species;
  ageGroup: string | null;
  breedName: string | null;
  condition: ReportCondition;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  status: ReportStatus;
  reporterCanStay: boolean;
  reporterUid: string;
  photoUrls: string[];
  organizationId: number | null;
  organizationName: string | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ReportStats {
  pendientes: number;
  aprobados: number;
  enProceso: number;
  rescatados: number;
  rechazados: number;
  total: number;
}

export interface ConversationResponse {
  id: number;
  reportId: number;
  reportSpecies: string | null;
  reportCoverPhotoUrl: string | null;
  organizationId: number;
  organizationName: string;
  organizationLogoUrl: string | null;
  citizenUid: string;
  status: "ABIERTA" | "CERRADA";
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  senderUid: string;
  senderIsOrg: boolean;
  senderName: string | null;
  content: string;
  createdAt: string;
}
