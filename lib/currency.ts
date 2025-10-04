import { useState, useEffect } from "react"

export interface CurrencyConversion {
  base: string
  target: string
  rate: number
  originalAmount: number
  convertedAmount: number
  timestamp: string
}

export interface ExchangeRates {
  base: string
  rates: { [key: string]: number }
  timestamp: string
}

export function useCurrencyConverter() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)

  const fetchExchangeRates = async (baseCurrency: string = "USD") => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/currency?base=${baseCurrency}`)
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates")
      }
      
      const data = await response.json()
      setExchangeRates(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch rates"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const convertAmount = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> => {
    if (fromCurrency === toCurrency) return amount
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/currency?base=${fromCurrency}&target=${toCurrency}&amount=${amount}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to convert currency")
      }
      
      const data = await response.json()
      return data.convertedAmount || amount
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to convert currency"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const convertCurrency = async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<CurrencyConversion> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/currency?base=${fromCurrency}&target=${toCurrency}&amount=${amount}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to convert currency")
      }
      
      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to convert currency"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string, locale: string = "en-US") => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } catch {
      return `${currency} ${amount.toFixed(2)}`
    }
  }

  const getConvertedAmount = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates?: { [key: string]: number }
  ): number | null => {
    if (!rates || fromCurrency === toCurrency) return amount
    
    if (fromCurrency === "USD") {
      return rates[toCurrency] ? amount * rates[toCurrency] : null
    }
    
    // Convert through USD
    const usdRate = rates[fromCurrency]
    const targetRate = rates[toCurrency]
    
    if (!usdRate || !targetRate) return null
    
    const usdAmount = amount / usdRate
    return usdAmount * targetRate
  }

  return {
    loading,
    error,
    exchangeRates,
    fetchExchangeRates,
    convertAmount,
    convertCurrency,
    formatCurrency,
    getConvertedAmount
  }
}

// Standalone utility functions for export
export const formatCurrency = (amount: number, currency: string, locale: string = "en-US") => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export const convertAmountSync = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: { [key: string]: number }
): number | null => {
  if (!rates || fromCurrency === toCurrency) return amount
  
  if (fromCurrency === "USD") {
    return rates[toCurrency] ? amount * rates[toCurrency] : null
  }
  
  // Convert through USD
  const usdRate = rates[fromCurrency]
  const targetRate = rates[toCurrency]
  
  if (!usdRate || !targetRate) return null
  
  const usdAmount = amount / usdRate
  return usdAmount * targetRate
}

// Common currencies for dropdowns
export const COMMON_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" }
]