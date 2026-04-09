"use client";
import React from "react";
import { cn } from "@/lib/utils";

type BorderBeamProps = {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
};

export const BorderBeam = ({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  delay = 0,
}: BorderBeamProps) => {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-lg border border-transparent [background:linear-gradient(transparent,transparent),conic-gradient(from_var(--anchor),var(--color-from),var(--color-to),var(--color-from),var(--color-to),var(--color-from),var(--color-to),var(--color-from),var(--color-to),var(--color-from))] [background-size:var(--size)_var(--size)] [background-position:0_0] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:xor] [animation:border-beam_var(--duration)_linear_infinite]",
        className
      )}
    />
  );
};
