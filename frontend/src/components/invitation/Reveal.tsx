import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { initialForAnimation, transitionForAnimation, visibleForAnimation } from '@/lib/animation'
import type { ResolvedAnimation } from '@/types'

interface RevealProps {
  animation?: ResolvedAnimation | null
  animationsEnabled?: boolean
  className?: string
  children: ReactNode
  as?: 'div' | 'section' | 'article'
}

export function Reveal({ animation, animationsEnabled = true, className, children }: RevealProps) {
  const reducedMotion = useReducedMotion() ?? false
  const enabled = Boolean(animation?.enabled) && animationsEnabled && !animation?.config.disabled

  if (!enabled || !animation) {
    return <div className={className}>{children}</div>
  }

  const config = animation.config

  return (
    <motion.div
      className={className}
      initial={initialForAnimation(animation.preset_type, config, reducedMotion)}
      whileInView={visibleForAnimation()}
      viewport={{ once: config.once ?? true, amount: 0.12, margin: '0px 0px -8% 0px' }}
      transition={
        transitionForAnimation(config, reducedMotion) as {
          duration: number
          delay: number
          ease: [number, number, number, number]
        }
      }
    >
      {children}
    </motion.div>
  )
}
