"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function TitleUpdater() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.length === 0) {
      document.title = "3DFlow";
      return;
    }

    let sectionName = "";

    if (segments[0] === 'c') {
      sectionName = "Client Portal";
    } else {
      // Filter out long IDs or uuids
      const nonIdSegments = segments.filter(s => s.length < 20 && isNaN(Number(s)));
      if (nonIdSegments.length > 0) {
        const lastSegment = nonIdSegments[nonIdSegments.length - 1];
        sectionName = lastSegment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    if (sectionName) {
      document.title = `${sectionName} | 3DFlow`;
    } else {
      document.title = "3DFlow";
    }
  }, [pathname]);

  return null;
}
