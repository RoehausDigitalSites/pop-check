"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-zinc-200 data-horizontal:h-2.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-2.5 sm:data-horizontal:h-2 sm:data-vertical:w-2"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-zinc-500/55 select-none data-horizontal:h-full data-vertical:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-7 shrink-0 rounded-full border border-zinc-300/90 bg-white shadow-sm transition-[box-shadow,transform] select-none hover:border-zinc-400/80 hover:shadow-md focus-visible:border-zinc-400 focus-visible:ring-[3px] focus-visible:ring-zinc-300/40 focus-visible:outline-hidden active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:size-6"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
