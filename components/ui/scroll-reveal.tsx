"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils"; // Assuming utils exists, otherwise I'll perform a check or use simple class concatenation

interface ScrollRevealProps {
    children: React.ReactNode | ((isVisible: boolean) => React.ReactNode);
    className?: string;
    threshold?: number; // 0 to 1
    delay?: number; // ms
    direction?: "up" | "down" | "left" | "right" | "none";
    duration?: number; // ms
}

export function ScrollReveal({
    children,
    className,
    threshold = 0.1,
    delay = 0,
    direction = "up",
    duration = 800,
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false); // Track if animation occurred

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) { // Only animate once

                    // Add a small delay to prevent instant trigger on load if desired, 
                    // or just set state.
                    // For "scroll interaction", we want it to trigger when it enters.
                    // If it's already in view, it triggers immediately. 
                    // To force a "scroll effect" even for top elements, we might need a delay.

                    setTimeout(() => {
                        setIsVisible(true);
                        setHasAnimated(true);
                    }, delay);

                    observer.unobserve(element);
                }
            },
            {
                threshold,
                rootMargin: "0px 0px -100px 0px", // Increased bottom margin to trigger later (closer to center)
            }
        );

        observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [threshold, delay, hasAnimated]);

    // Initial styles based on direction
    const getInitialTransform = () => {
        switch (direction) {
            case "up": return "translateY(50px)";
            case "down": return "translateY(-50px)";
            case "left": return "translateX(50px)";
            case "right": return "translateX(-50px)";
            default: return "none";
        }
    };

    const style: React.CSSProperties = {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : getInitialTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1), transform ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
        willChange: "opacity, transform",
    };

    return (
        <div ref={ref} className={className} style={style}>
            {typeof children === "function" ? (children as (isVisible: boolean) => React.ReactNode)(isVisible) : children}
        </div>
    );
}
