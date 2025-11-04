import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useUserSettings } from "../../hooks/useUserSettings"
import { cn } from "../../lib/utils"

interface AnimatedThemeTogglerProps {
  className?: string
  duration?: number
}

export function AnimatedThemeToggler({ 
  className,
  duration = 400 
}: AnimatedThemeTogglerProps) {
  const { settings, updateTheme, isUpdating } = useUserSettings()
  const [isMounted, setIsMounted] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

  // Get current theme from settings, localStorage, or default to 'light'
  const getInitialTheme = () => {
    if (settings?.theme) return settings.theme
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  }
  
  const currentTheme = getInitialTheme()
  const isDark = currentTheme === 'dark'

  // Handle mounting to avoid hydration issues
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Apply theme to document whenever it changes
  React.useEffect(() => {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [currentTheme])

  const toggleTheme = () => {
    if (isAnimating || isUpdating) return
    
    setIsAnimating(true)
    const newTheme = isDark ? 'light' : 'dark'
    
    // Save to localStorage immediately for instant feedback
    localStorage.setItem('theme', newTheme)
    
    // Apply theme immediately (even if backend update fails)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Update theme in backend (non-blocking)
    try {
      updateTheme(newTheme)
    } catch (error) {
      console.error('Error updating theme:', error)
      // Theme is already applied, so we continue
    }
    
    // Reset animation state after transition
    setTimeout(() => {
      setIsAnimating(false)
    }, duration)
  }

  if (!isMounted) {
    // Return a placeholder to avoid hydration mismatch
    return (
      <button
        className={cn(
          "relative w-14 h-8 rounded-full border border-input bg-background transition-colors",
          className
        )}
        aria-label="Toggle theme"
        disabled
      >
        <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-muted" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-14 h-8 rounded-full border border-input bg-background transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        isAnimating && "pointer-events-none",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={isUpdating || isAnimating}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {/* Background gradient animation */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-300",
          isDark 
            ? "bg-gradient-to-r from-slate-800 to-slate-900 opacity-100" 
            : "bg-gradient-to-r from-yellow-200 to-orange-200 opacity-0"
        )}
        style={{
          transitionDuration: `${duration}ms`,
        }}
      />
      
      {/* Icons container */}
      <div className="relative flex items-center justify-between h-full px-1.5">
        {/* Sun icon */}
        <Sun
          className={cn(
            "h-4 w-4 text-yellow-500 transition-all duration-300",
            isDark 
              ? "opacity-0 scale-0 rotate-90" 
              : "opacity-100 scale-100 rotate-0"
          )}
          style={{
            transitionDuration: `${duration}ms`,
          }}
        />
        
        {/* Moon icon */}
        <Moon
          className={cn(
            "h-4 w-4 text-slate-300 transition-all duration-300",
            isDark 
              ? "opacity-100 scale-100 rotate-0" 
              : "opacity-0 scale-0 -rotate-90"
          )}
          style={{
            transitionDuration: `${duration}ms`,
          }}
        />
      </div>

      {/* Toggle circle */}
      <div
        className={cn(
          "absolute top-1 h-6 w-6 rounded-full bg-background shadow-lg transition-all duration-300",
          "flex items-center justify-center border border-input",
          isDark ? "translate-x-6" : "translate-x-0"
        )}
        style={{
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Small inner circle for extra detail */}
        <div
          className={cn(
            "h-3 w-3 rounded-full transition-all duration-300",
            isDark 
              ? "bg-slate-700" 
              : "bg-yellow-400"
          )}
          style={{
            transitionDuration: `${duration}ms`,
          }}
        />
      </div>
    </button>
  )
}

