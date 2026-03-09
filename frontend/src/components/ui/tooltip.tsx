import React, { useState } from "react"
import { cn } from "@/lib/utils"

export function TooltipProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}

export function Tooltip({ children }: { children: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(false)

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {React.Children.map(children, child => {
                if (React.isValidElement(child) && (child.type as any).displayName === "TooltipContent") {
                    return isVisible ? child : null
                }
                return child
            })}
        </div>
    )
}

export function TooltipTrigger({ render, children }: { render?: (props: any) => React.ReactNode, children?: React.ReactNode }) {
    if (render) return <>{render({})}</>
    return <>{children}</>
}
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps {
    children: React.ReactNode
    className?: string
    side?: "top" | "bottom"
}

export function TooltipContent({ children, className, side = "top" }: TooltipContentProps) {
    return (
        <div
            className={cn(
                "absolute z-[99999] px-3 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg shadow-2xl whitespace-nowrap pointer-events-none mb-2",
                side === "top" ? "bottom-full left-1/2 -translate-x-1/2" : "top-full left-1/2 -translate-x-1/2 mt-2",
                className
            )}
        >
            {children}
            {/* Seta (Arrow) */}
            <div
                className={cn(
                    "absolute left-1/2 -translate-x-1/2 border-4 border-transparent",
                    side === "top" ? "top-full border-t-slate-900" : "bottom-full border-b-slate-900"
                )}
            />
        </div>
    )
}
TooltipContent.displayName = "TooltipContent"
