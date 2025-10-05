import { Sidebar } from "@/components/layout/sidebar"
import PageTransition from "./PageTransition"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageTransition>

      <Sidebar>
        {children}
      </Sidebar>
    </PageTransition>
  )
}