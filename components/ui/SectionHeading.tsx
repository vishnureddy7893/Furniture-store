'use client'

import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  body?: string
  align?: 'start' | 'center'
  className?: string
  /** Rendered at the end of the heading row on wide screens. */
  action?: React.ReactNode
}

export default function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'start',
  className,
  action,
}: SectionHeadingProps) {
  const centered = align === 'center'

  return (
    <div
      className={cn(
        'mb-10 gap-6 md:mb-14',
        centered ? 'text-center' : 'text-start md:flex md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn(centered && 'mx-auto max-w-2xl')}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="font-primary text-3xl font-semibold leading-tight text-ink md:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
        {body && (
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
            {body}
          </p>
        )}
      </div>
      {action && <div className={cn('mt-6 md:mt-0', centered && 'flex justify-center')}>{action}</div>}
    </div>
  )
}
