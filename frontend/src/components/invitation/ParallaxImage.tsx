import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { cn } from '@/lib/utils'

export function ParallaxImage({
  src,
  alt,
  className,
  imgClassName,
  enabled = true,
}: {
  src: string
  alt?: string
  className?: string
  imgClassName?: string
  enabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-7%', '7%'])

  if (!enabled || reducedMotion) {
    return (
      <img
        src={src}
        alt={alt ?? ''}
        className={cn('h-full w-full object-cover', className, imgClassName)}
        loading="eager"
      />
    )
  }

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <motion.img
        src={src}
        alt={alt ?? ''}
        className={cn('h-full w-full object-cover', imgClassName)}
        style={{ y, scale: 1.16 }}
        loading="eager"
      />
    </div>
  )
}
