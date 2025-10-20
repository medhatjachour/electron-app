import React from 'react'

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: React.ReactNode
}

export default function Link({ href, children, ...rest }: LinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Let normal clicks navigate via history API
    if (!e.defaultPrevented) {
      e.preventDefault()
      globalThis.history.pushState(null, '', href)
      globalThis.dispatchEvent(new PopStateEvent('popstate'))
    }
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
