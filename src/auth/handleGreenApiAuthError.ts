import type { GreenApiAuthError } from "@/api/greenApiClient";
import { useAuthStore } from "@/auth/authStore";

export function handleGreenApiAuthError(error: GreenApiAuthError): string {
  switch (error.type) {
    case "invalidIdInstance":
    case "invalidApiTokenInstance":
      useAuthStore.getState().logout();
      return "Сессия недействительна, войдите заново";
    case "serviceUnavailable":
      return "Сервис GREEN-API недоступен, попробуйте позже";
  }
}
