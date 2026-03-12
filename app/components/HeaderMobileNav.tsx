"use client";

import { usePathname } from "next/navigation";

import BackButton from "./BackButton";
import MobileNav from "./MobileNav";

const gymDetailPattern = /^\/gyms\/[^/]+$/;

export default function HeaderMobileNav() {
    const pathname = usePathname();
    const isGymDetailPage = pathname ? gymDetailPattern.test(pathname) : false;

    if (isGymDetailPage) {
        return <BackButton className="-ml-1" />;
    }

    return <MobileNav />;
}
