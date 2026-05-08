"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { PortalHeader } from "@/layouts/portal/portal-header"
import { PortalSidebar } from "@/layouts/portal/portal-sidebar"
import { getToken } from "@/services/api"

export default function ShopPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const { shopId } = useParams<{ shopId: string }>()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace("/login")
      return
    }
    document.cookie = `access_token=${token}; path=/; SameSite=Lax`
    setReady(true)
  }, [router])

  if (!ready) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <PortalSidebar shopId={shopId} />
        <div className="flex flex-1 flex-col">
          <PortalHeader />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
