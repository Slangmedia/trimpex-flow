import { EmployeeSidebar } from "@/components/layout/EmployeeSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader"; // We can reuse the header
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "EMPLOYEE") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <EmployeeSidebar />
      </div>

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="w-full p-5">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
