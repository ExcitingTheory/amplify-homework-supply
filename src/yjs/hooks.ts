/**
 * useYjs - React hook for Yjs document provider
 * 
 * Manages document lifecycle and provides typed access to Y.Maps and Y.Arrays
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { YjsDocProvider, YjsProviderConfig } from './YjsProvider'

export function useYjsProvider(config: YjsProviderConfig) {
  const providerRef = useRef<YjsDocProvider | null>(null)
  const [isSynced, setIsSynced] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Create provider if not already created
    if (!providerRef.current) {
      providerRef.current = new YjsDocProvider(config)
    }

    const provider = providerRef.current
    const wsProvider = (provider as any).wsProvider

    // Listen for sync status
    const handleSync = (synced: boolean) => {
      setIsSynced(synced)
    }

    // Listen for connection status
    const handleStatus = ({ status }: { status: string }) => {
      setIsConnected(status === 'connected')
    }

    if (wsProvider) {
      wsProvider.on('sync', handleSync)
      wsProvider.on('status', handleStatus)
    }

    return () => {
      if (wsProvider) {
        wsProvider.off('sync', handleSync)
        wsProvider.off('status', handleStatus)
      }
    }
  }, [config.docName])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      // Don't destroy on unmount - keep document in memory for re-mounting
      // providerRef.current?.destroy()
    }
  }, [])

  return {
    provider: providerRef.current!,
    isSynced,
    isConnected,
  }
}

/**
 * Helper to check if Y type is ready to read from
 */
function isYTypeReady(ytype: Y.Map<any> | Y.Array<any> | Y.Text): boolean {
  try {
    // Try to access the doc - will throw if not attached
    return ytype.doc !== null
  } catch {
    return false
  }
}

/**
 * Hook to sync a Y.Map with React state
 */
export function useYMap<T extends Record<string, any>>(
  ymap: Y.Map<any>,
  initialState?: T
) {
  const [state, setState] = useState<T>(initialState || ({} as T))

  useEffect(() => {
    // Guard against uninitialized Y types
    if (!isYTypeReady(ymap)) {
      console.warn('[useYMap] Y.Map not ready - skipping initial read')
      return
    }

    // Initialize state from Y.Map
    try {
      const initialData = {} as T
      ymap.forEach((value, key) => {
        initialData[key as keyof T] = value
      })
      setState(initialData)
    } catch (err) {
      console.warn('[useYMap] Failed to initialize from Y.Map:', err)
    }

    // Subscribe to changes
    const updateHandler = () => {
      try {
        const newData = {} as T
        ymap.forEach((value, key) => {
          newData[key as keyof T] = value
        })
        setState(newData)
      } catch (err) {
        console.warn('[useYMap] Failed to update from Y.Map:', err)
      }
    }

    ymap.observe(updateHandler)

    return () => {
      ymap.unobserve(updateHandler)
    }
  }, [ymap])

  const updateValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      ymap.set(String(key), value)
    },
    [ymap]
  )

  return {
    state,
    updateValue,
    ymap,
  }
}

/**
 * Hook to sync a Y.Array with React state
 */
export function useYArray<T>(yarray: Y.Array<T>) {
  const [items, setItems] = useState<T[]>([])

  useEffect(() => {
    // Guard against uninitialized Y types
    if (!isYTypeReady(yarray)) {
      console.warn('[useYArray] Y.Array not ready - skipping initial read')
      return
    }

    // Initialize items from Y.Array
    try {
      setItems(Array.from(yarray))
    } catch (err) {
      console.warn('[useYArray] Failed to initialize from Y.Array:', err)
    }

    // Subscribe to changes
    const updateHandler = () => {
      try {
        setItems(Array.from(yarray))
      } catch (err) {
        console.warn('[useYArray] Failed to update from Y.Array:', err)
      }
    }

    yarray.observe(updateHandler)

    return () => {
      yarray.unobserve(updateHandler)
    }
  }, [yarray])

  const push = useCallback(
    (item: T) => {
      yarray.push([item])
    },
    [yarray]
  )

  const insert = useCallback(
    (index: number, item: T) => {
      yarray.insert(index, [item])
    },
    [yarray]
  )

  const delete_ = useCallback(
    (index: number, length: number = 1) => {
      yarray.delete(index, length)
    },
    [yarray]
  )

  const clear = useCallback(() => {
    yarray.delete(0, yarray.length)
  }, [yarray])

  return {
    items,
    push,
    insert,
    delete: delete_,
    clear,
    yarray,
  }
}

/**
 * Hook to sync Y.Text (for rich text editors like Lexical)
 */
export function useYText(ytext: Y.Text) {
  const [content, setContent] = useState('')

  useEffect(() => {
    // Guard against uninitialized Y types
    if (!isYTypeReady(ytext)) {
      console.warn('[useYText] Y.Text not ready - skipping initial read')
      return
    }

    // Initialize content
    try {
      setContent(ytext.toString())
    } catch (err) {
      console.warn('[useYText] Failed to initialize from Y.Text:', err)
    }

    // Subscribe to changes
    const updateHandler = () => {
      try {
        setContent(ytext.toString())
      } catch (err) {
        console.warn('[useYText] Failed to update from Y.Text:', err)
      }
    }

    ytext.observe(updateHandler)

    return () => {
      ytext.unobserve(updateHandler)
    }
  }, [ytext])

  const insert = useCallback(
    (index: number, text: string) => {
      ytext.insert(index, text)
    },
    [ytext]
  )

  const delete_ = useCallback(
    (index: number, length: number) => {
      ytext.delete(index, length)
    },
    [ytext]
  )

  const format = useCallback(
    (index: number, length: number, format: Record<string, any>) => {
      ytext.format(index, length, format)
    },
    [ytext]
  )

  return {
    content,
    insert,
    delete: delete_,
    format,
    ytext,
    length: ytext.length,
  }
}

/**
 * Hook for awareness (presence tracking)
 */
export function useAwareness(awareness: Awareness) {
  const [awareness_, setAwareness] = useState(awareness.getLocalState())
  const [remoteStates, setRemoteStates] = useState<Map<number, Record<string, any>>>(
    new Map()
  )

  useEffect(() => {
    const updateHandler = () => {
      // Update local state if changed
      const localState = awareness.getLocalState()
      if (localState) {
        setAwareness(localState)
      }

      // Update remote states
      const states = new Map(awareness.getStates())
      setRemoteStates(states)
    }

    awareness.on('change', updateHandler)

    return () => {
      awareness.off('change', updateHandler)
    }
  }, [awareness])

  const setLocalState = useCallback(
    (state: Record<string, any>) => {
      awareness.setLocalState(state)
    },
    [awareness]
  )

  return {
    localState: awareness_,
    remoteStates,
    setLocalState,
    clientId: awareness.clientID,
  }
}
