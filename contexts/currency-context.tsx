"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getCurrencySymbol, COMMON_CURRENCIES } from '@/lib/currency'

interface CurrencyContextType {
  currency: string
  symbol: string
  setCurrency: (currency: string) => void
  formatAmount: (amount: number) => string
  availableCurrencies: typeof COMMON_CURRENCIES
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: React.ReactNode
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { data: session } = useSession()
  const [currency, setCurrencyState] = useState<string>('USD')
  const [symbol, setSymbol] = useState<string>('$')

  // Update currency when session changes (user logs in)
  useEffect(() => {
    if (session?.user?.currency) {
      setCurrencyState(session.user.currency)
      setSymbol(getCurrencySymbol(session.user.currency))
    }
  }, [session])

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency)
    setSymbol(getCurrencySymbol(newCurrency))
    
    // Optionally save to user preferences
    if (session?.user) {
      updateUserCurrency(newCurrency)
    }
  }

  const updateUserCurrency = async (newCurrency: string) => {
    try {
      await fetch('/api/user/currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency: newCurrency }),
      })
    } catch (error) {
      console.error('Failed to update user currency:', error)
    }
  }

  const formatAmount = (amount: number): string => {
    const formattedAmount = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    
    // For some currencies, symbol goes after the amount
    const symbolAfterCurrencies = ['SEK', 'NOK', 'DKK', 'CZK', 'PLN', 'HUF']
    if (symbolAfterCurrencies.includes(currency)) {
      return `${formattedAmount} ${symbol}`
    }
    
    return `${symbol}${formattedAmount}`
  }

  const value: CurrencyContextType = {
    currency,
    symbol,
    setCurrency,
    formatAmount,
    availableCurrencies: COMMON_CURRENCIES
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}