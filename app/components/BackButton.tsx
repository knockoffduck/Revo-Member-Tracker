"use client";

import { Button } from "@/components/ui/button";
import { IoArrowBackOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";

export default function BackButton() {
    const router = useRouter();

    return (
        <Button onClick={() => router.back()}>
            <IoArrowBackOutline />
        </Button>
    );
}
