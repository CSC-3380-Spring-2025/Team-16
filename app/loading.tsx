"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Loading() {
    const messages = ["Loading...", "Emailing professors...", "Checking courses...", "Generating schedules...", "Frolicking..."];
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 1750); // Change message every 1.5 seconds

    return () => clearInterval(interval);
    }, []); // Run once on mount

    return (
        <div style={{background:"#EEF3F9"}}className="fixed inset-0 flex flex-col items-center justify-center z-50">
            <div style={{ borderTopColor: "#0d93c4", borderBottomColor: "#0d93c4" }} className="relative animate-spin rounded-full h-20 w-20 border-t-4 mb-6">
                <Image
                    src="/logo.svg"
                    alt="ScheduleLSU logo"
                    width={80}
                    height={80}
                    style={{ transform: "none", pointerEvents: "none", fill: "#0d93c4", filter: "invert(50%) sepia(32%) saturate(6093%) hue-rotate(166deg) brightness(90%) contrast(90%)"}}
                    className="absolute h-24 w-24 inset-0 m-auto"
                />
            </div>
        <p className="text-lg font-medium text-gray-700 font-[family-name:var(--font-geist-mono)]">{messages[messageIndex]}</p>
        </div>
    );
}
