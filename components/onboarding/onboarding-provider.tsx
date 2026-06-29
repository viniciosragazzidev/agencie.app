"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { SetupWizard } from "./setup-wizard"
import { TourOverlay } from "./tour-overlay"
import { FloatingChecklist } from "./floating-checklist"

interface OnboardingContextType {
  shouldShowWizard: boolean
  shouldShowTour: boolean
  refreshOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType>({
  shouldShowWizard: false,
  shouldShowTour: false,
  refreshOnboarding: () => {}
})

export function useOnboarding() {
  return useContext(OnboardingContext)
}

interface OnboardingProviderProps {
  children: React.ReactNode
  userId: string
}

export function OnboardingProvider({ children, userId }: OnboardingProviderProps) {
  const [loading, setLoading] = useState(true)
  const [onboardingState, setOnboardingState] = useState({
    onboardingCompleted: false,
    tutorialCompleted: false,
    setupProgress: {
      agencyConfigured: false,
      firstClientCreated: false,
      firstServiceCreated: false,
      integrationConnected: false,
      contractGenerated: false
    }
  })

  const fetchOnboarding = async () => {
    try {
      const res = await fetch("/api/onboarding")
      if (res.ok) {
        const data = await res.json()
        setOnboardingState(data)
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOnboarding()
  }, [])

  const shouldShowWizard = !loading && !onboardingState.onboardingCompleted
  const shouldShowTour = !loading && 
    onboardingState.onboardingCompleted && 
    !onboardingState.tutorialCompleted

  const handleWizardComplete = () => {
    setOnboardingState(prev => ({ ...prev, onboardingCompleted: true }))
  }

  const handleTourComplete = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialCompleted: true })
      })
      setOnboardingState(prev => ({ ...prev, tutorialCompleted: true }))
    } catch {
      // Silent fail
    }
  }

  const handleTourSkip = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialCompleted: true })
      })
      setOnboardingState(prev => ({ ...prev, tutorialCompleted: true }))
    } catch {
      // Silent fail
    }
  }

  if (loading) {
    return <>{children}</>
  }

  return (
    <OnboardingContext.Provider value={{
      shouldShowWizard,
      shouldShowTour,
      refreshOnboarding: fetchOnboarding
    }}>
      {children}

      {/* Setup Wizard */}
      {shouldShowWizard && (
        <SetupWizard 
          userId={userId}
          onComplete={handleWizardComplete}
        />
      )}

      {/* Dashboard Tour */}
      {shouldShowTour && (
        <TourOverlay
          isActive={shouldShowTour}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}

      {/* Floating Checklist */}
      {onboardingState.onboardingCompleted && (
        <FloatingChecklist userId={userId} />
      )}
    </OnboardingContext.Provider>
  )
}
