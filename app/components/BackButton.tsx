"use client";

import { Button } from "@/components/ui/button";
import { IoArrowBackOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type BackButtonProps = {
    className?: string;
};

export default function BackButton({ className }: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
            return;
        }

        router.push("/gyms");
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Go back"
            className={cn("h-10 w-10 rounded-full", className)}
        >
            <IoArrowBackOutline />
        </Button>
    );
}
