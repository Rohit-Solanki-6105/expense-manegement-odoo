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

// Common currencies for dropdowns with symbols
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
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "EGP", name: "Egyptian Pound", symbol: "£" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
]

// Get currency symbol for a given currency code
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = COMMON_CURRENCIES.find(c => c.code === currencyCode.toUpperCase())
  return currency?.symbol || currencyCode
}

// Format currency with symbol
export const formatCurrencyWithSymbol = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode)
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  // For some currencies, symbol goes after the amount
  const symbolAfterCurrencies = ['SEK', 'NOK', 'DKK', 'CZK', 'PLN', 'HUF']
  if (symbolAfterCurrencies.includes(currencyCode.toUpperCase())) {
    return `${formattedAmount} ${symbol}`
  }
  
  return `${symbol}${formattedAmount}`
}