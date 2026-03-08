import { useOrganization } from "@/contexts/organization-context"

export function usePermissions() {
  const { role } = useOrganization()

  return {
    canCreate: role === "admin",
    canEdit: role === "admin",
    canDelete: role === "admin",
    canDownload: role === "admin",
    isAdmin: role === "admin",
    isViewer: role === "viewer",
  }
}
