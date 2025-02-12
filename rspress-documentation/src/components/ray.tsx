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
        'absolute top-0 left-0 z-[40]',
        'w-full !max-w-full h-[220px]',
        'flex flex-col items-center justify-center',
        'bg-transparent transition-bg overflow-hidden opacity-25 dark:opacity-[.55] pointer-events-none',
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
