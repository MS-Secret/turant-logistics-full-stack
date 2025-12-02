import Sidebar from "@/components/sidebar";
import React from "react";

const DashboardLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex min-h-screen bg-gray-50 h-[100vh] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto h-full">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
