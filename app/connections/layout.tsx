"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, ArrowRightCircle, Settings } from "lucide-react";

export default function ConnectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const links = [
    {
      href: "/connections/sources",
      label: "Source Connections",
      icon: <Database className="h-5 w-5" />,
    },
    {
      href: "/connections/targets",
      label: "Target Connections",
      icon: <ArrowRightCircle className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <nav className="flex-1 p-4">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Connections
          </p>
          
          <ul className="space-y-1">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          
          <p className="text-xs font-medium text-gray-500 mb-2 mt-6 uppercase tracking-wider">
            Settings
          </p>
          
          <ul className="space-y-1">
            <li>
              <Link
                href="/connections/settings"
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  pathname === "/connections/settings"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>API Keys & Security</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 bg-white">
        {children}
      </div>
    </div>
  );
} 