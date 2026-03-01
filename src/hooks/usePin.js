import { useCallback } from 'react'

export function usePin() {
  const requirePin = useCallback((onSuccess) => {
    onSuccess()
  }, [])

  return {
    pinModalOpen: false,
    pinError: false,
    requirePin,
    submitPin: () => {},
    cancelPin: () => {},
  }
}
