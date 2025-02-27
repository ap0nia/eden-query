import { cn } from '../utils/cn'

type RayProps = {
  isSafari?: boolean
  animated?: boolean
  isStatic?: boolean
  className?: string
}

export function Ray(props: RayProps) {
  const { isStatic, isSafari, animated, className } = props

  const shouldAnimate =
    animated || (typeof navigator !== 'undefined' && navigator?.hardwareConcurrency > 4)

  return (
    <div
      className={cn(
        'absolute left-0 top-0 z-[40]',
        'h-[220px] w-full !max-w-full',
        'flex flex-col items-center justify-center',
        'transition-bg pointer-events-none overflow-hidden bg-transparent opacity-25 dark:opacity-[.55]',
        className,
      )}
    >
      <div
        className={cn(
          'jumbo static absolute opacity-60',
          isSafari && '-safari',
          isStatic && '-static',
          shouldAnimate && '-animate',
        )}
      />
    </div>
  )
}
