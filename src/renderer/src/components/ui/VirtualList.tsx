/**
 * Virtual List Component
 * 
 * Renders only visible items for performance with large datasets
 * Uses virtual scrolling to handle thousands of items efficiently
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  onScroll?: (scrollTop: number) => void
}

/**
 * Virtual List Component
 * Only renders items visible in viewport + overscan buffer
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  className = '',
  onScroll
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )
  const visibleItems = items.slice(startIndex, endIndex + 1)
  const offsetY = startIndex * itemHeight

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop
      setScrollTop(newScrollTop)
      onScroll?.(newScrollTop)
    },
    [onScroll]
  )

  // Reset scroll on items change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
      setScrollTop(0)
    }
  }, [items.length])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Virtual Table Component
 * Optimized for table rows
 */
interface VirtualTableProps<T> {
  data: T[]
  rowHeight: number
  containerHeight: number
  columns: Array<{
    key: string
    header: string
    width?: string
    render: (item: T, index: number) => React.ReactNode
  }>
  overscan?: number
  className?: string
  onRowClick?: (item: T, index: number) => void
}

export function VirtualTable<T>({
  data,
  rowHeight,
  containerHeight,
  columns,
  overscan = 5,
  className = '',
  onRowClick
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const totalHeight = data.length * rowHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endIndex = Math.min(
    data.length - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  )
  const visibleRows = data.slice(startIndex, endIndex + 1)
  const offsetY = startIndex * rowHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div className={className}>
      {/* Table Header */}
      <div className="flex border-b bg-gray-50 dark:bg-gray-800">
        {columns.map(col => (
          <div
            key={col.key}
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            style={{ width: col.width || 'auto', flex: col.width ? undefined : 1 }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtual Scrolling Container */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleRows.map((row, index) => {
              const actualIndex = startIndex + index
              return (
                <div
                  key={actualIndex}
                  className="flex border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  style={{ height: rowHeight }}
                  onClick={() => onRowClick?.(row, actualIndex)}
                >
                  {columns.map(col => (
                    <div
                      key={col.key}
                      className="px-4 py-3 text-sm"
                      style={{ width: col.width || 'auto', flex: col.width ? undefined : 1 }}
                    >
                      {col.render(row, actualIndex)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Virtual Grid Component
 * For grid layouts with variable item sizes
 */
interface VirtualGridProps<T> {
  items: T[]
  itemsPerRow: number
  itemHeight: number
  containerHeight: number
  gap?: number
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
}

export function VirtualGrid<T>({
  items,
  itemsPerRow,
  itemHeight,
  containerHeight,
  gap = 16,
  overscan = 2,
  renderItem,
  className = ''
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const rowHeight = itemHeight + gap

  // Calculate rows
  const totalRows = Math.ceil(items.length / itemsPerRow)
  const totalHeight = totalRows * rowHeight

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  )

  const visibleRows: T[][] = []
  for (let row = startRow; row <= endRow; row++) {
    const rowItems: T[] = []
    for (let col = 0; col < itemsPerRow; col++) {
      const index = row * itemsPerRow + col
      if (index < items.length) {
        rowItems.push(items[index])
      }
    }
    if (rowItems.length > 0) {
      visibleRows.push(rowItems)
    }
  }

  const offsetY = startRow * rowHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleRows.map((rowItems, rowIndex) => (
            <div
              key={startRow + rowIndex}
              className="flex"
              style={{ gap, marginBottom: gap }}
            >
              {rowItems.map((item, colIndex) => {
                const actualIndex = (startRow + rowIndex) * itemsPerRow + colIndex
                return (
                  <div key={actualIndex} style={{ flex: `0 0 calc((100% - ${gap * (itemsPerRow - 1)}px) / ${itemsPerRow})` }}>
                    {renderItem(item, actualIndex)}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
