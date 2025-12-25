/**
 * Unit tests for debounce-related hooks
 * Tests useDebounce, useThrottle, and useDebouncedCallback hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebounce, useThrottle, useDebouncedCallback } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))

    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    // Initial value
    expect(result.current).toBe('initial')

    // Change value
    rerender({ value: 'changed', delay: 300 })
    expect(result.current).toBe('initial') // Should still be old value

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(result.current).toBe('changed')
    })
  })

  it('should reset debounce timer on value change', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } }
    )

    // Change value quickly
    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(150) // Half way through
    })

    // Change again before first debounce completes
    rerender({ value: 'third' })

    // First debounce should not have completed
    expect(result.current).toBe('first')

    // Advance full delay from last change
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('third')
  })

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'test', delay: 500 } }
    )

    rerender({ value: 'changed', delay: 200 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('changed')
  })

  it('should work with different data types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: { count: 1 } } }
    )

    rerender({ value: { count: 2 } })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toEqual({ count: 2 })
  })

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'changed' })

    // Should update immediately with zero delay
    expect(result.current).toBe('changed')
  })
})

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('initial', 300))

    expect(result.current).toBe('initial')
  })

  it('should throttle value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 300),
      { initialProps: { value: 'initial' } }
    )

    // Change value - should update immediately (first change)
    rerender({ value: 'first' })
    expect(result.current).toBe('first')

    // Change again quickly - should be throttled
    rerender({ value: 'second' })
    expect(result.current).toBe('first') // Still old value

    // Wait for throttle interval
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('second')
  })

  it('should allow updates after throttle interval', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 200),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'first' })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'second' })
    expect(result.current).toBe('second')
  })

  it('should handle rapid consecutive changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 100),
      { initialProps: { value: 'v0' } }
    )

    // Rapid changes
    rerender({ value: 'v1' })
    expect(result.current).toBe('v1')

    rerender({ value: 'v2' })
    rerender({ value: 'v3' })
    rerender({ value: 'v4' })

    // Should still be first value
    expect(result.current).toBe('v1')

    // After throttle interval, should get latest value
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe('v4')
  })

  it('should handle interval changes', () => {
    const { result, rerender } = renderHook(
      ({ value, interval }) => useThrottle(value, interval),
      { initialProps: { value: 'test', interval: 500 } }
    )

    rerender({ value: 'changed', interval: 100 })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe('changed')
  })
})

describe('useDebouncedCallback', () => {
  let mockCallback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockCallback = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call callback after delay', () => {
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 300))

    act(() => {
      result.current()
    })

    expect(mockCallback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should reset debounce timer on multiple calls', () => {
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 300))

    act(() => {
      result.current()
    })

    act(() => {
      vi.advanceTimersByTime(200) // Partial delay
    })

    act(() => {
      result.current() // Reset timer
    })

    act(() => {
      vi.advanceTimersByTime(200) // Another partial delay
    })

    expect(mockCallback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100) // Complete delay from last call
    })

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should call callback with correct arguments', () => {
    const mockCallbackWithArgs = vi.fn()
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallbackWithArgs, 100)
    )

    act(() => {
      result.current('arg1', 'arg2', 123)
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(mockCallbackWithArgs).toHaveBeenCalledWith('arg1', 'arg2', 123)
  })

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ delay }) => useDebouncedCallback(mockCallback, delay),
      { initialProps: { delay: 500 } }
    )

    act(() => {
      result.current()
    })

    rerender({ delay: 200 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { result, unmount } = renderHook(() => useDebouncedCallback(mockCallback, 300))

    act(() => {
      result.current()
    })

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('should handle zero delay', () => {
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 0))

    act(() => {
      result.current()
    })

    // Should call immediately with zero delay
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should work with async callbacks', async () => {
    const asyncMockCallback = vi.fn().mockResolvedValue('result')
    const { result } = renderHook(() => useDebouncedCallback(asyncMockCallback, 100))

    act(() => {
      result.current()
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(asyncMockCallback).toHaveBeenCalledTimes(1)
    })
  })
})

describe('Integration tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce work correctly with React state changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: 'initial' } }
    )

    // Simulate rapid state changes like user typing
    rerender({ value: 'h' })
    rerender({ value: 'he' })
    rerender({ value: 'hel' })
    rerender({ value: 'hell' })
    rerender({ value: 'hello' })

    // Should still have initial value
    expect(result.current).toBe('initial')

    // After debounce delay, should have final value
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('hello')
  })

  it('should throttle work correctly with scroll events', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 100),
      { initialProps: { value: 0 } }
    )

    // Simulate rapid scroll events
    rerender({ value: 10 })
    expect(result.current).toBe(10)

    rerender({ value: 20 })
    rerender({ value: 30 })
    rerender({ value: 40 })

    // Should still be first value
    expect(result.current).toBe(10)

    // After throttle interval, should get latest value
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe(40)
  })
})