import { api } from "./client";

export interface ScanResult {
  scanned: number;
  newOpportunities: number;
  notified: number;
}

export const alertsApi = {
  runScan: () => api.post<ScanResult>("/alerts/scan"),
};
