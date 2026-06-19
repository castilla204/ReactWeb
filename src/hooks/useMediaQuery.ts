import { useState, useEffect } from "react"

function getInitialMatch(query: string) {
  if (typeof window === "undefined") return false
  return window.matchMedia(query).matches
}

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(() => getInitialMatch(query))

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}


