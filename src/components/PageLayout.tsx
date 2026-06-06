import type { ReactNode } from 'react'
import Spinner from './Spinner'

interface PageLayoutProps {
  children?: ReactNode
  mainClassName?: string
  className?: string
  loading?: boolean
}

// sarmalayici
export default function PageLayout({
  children,
  mainClassName,
  className,
  loading = false,
}: PageLayoutProps) {
  return (
    <div className={className}>
      {loading
        ? <Spinner inline />
        : <main className={mainClassName}>{children}</main>}
    </div>
  )
}
