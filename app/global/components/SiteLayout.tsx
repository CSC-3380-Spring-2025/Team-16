"use client";

import NavBar from "./NavBar";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

const SiteLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname(); // Get the current page path

  return (
    <div>
      {pathname !== "/" && <NavBar />} {/* Shows the NavBar on every page except homepage */}
      <main>{children}</main>
    </div>
  );
};

export default SiteLayout;
