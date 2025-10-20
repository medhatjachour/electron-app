import React from 'react'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps): JSX.Element {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm ${className}`}>
        {children}
      </table>
    </div>
  )
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

export function TableHeader({ children, className = '' }: TableHeaderProps): JSX.Element {
  return (
    <thead className={`border-b bg-muted/50 ${className}`}>
      {children}
    </thead>
  )
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

export function TableBody({ children, className = '' }: TableBodyProps): JSX.Element {
  return <tbody className={`${className}`}>{children}</tbody>
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
}

export function TableRow({ children, className = '' }: TableRowProps): JSX.Element {
  return (
    <tr className={`border-b transition-colors hover:bg-muted/50 ${className}`}>
      {children}
    </tr>
  )
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
}

export function TableCell({ children, className = '' }: TableCellProps): JSX.Element {
  return (
    <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
      {children}
    </td>
  )
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
}

export function TableHead({ children, className = '' }: TableHeadProps): JSX.Element {
  return (
    <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
      {children}
    </th>
  )
}