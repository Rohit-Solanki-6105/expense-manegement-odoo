import { NextRequest, NextResponse } from "next/server"

// Cache exchange rates for 1 hour to avoid hitting API limits
const cache = new Map<string, { rates: any; timestamp: number }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const baseCurrency = searchParams.get("base") || "USD"
    const targetCurrency = searchParams.get("target")
    const amount = parseFloat(searchParams.get("amount") || "1")

    // Check cache first
    const cacheKey = baseCurrency.toUpperCase()
    const cached = cache.get(cacheKey)
    const now = Date.now()

    let rates
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      rates = cached.rates
    } else {
      // Fetch fresh data from API
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`)
      
      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`)
      }

      const data = await response.json()
      rates = data.rates

      // Cache the result
      cache.set(cacheKey, { rates, timestamp: now })
    }

    // If target currency is specified, return specific conversion
    if (targetCurrency) {
      const targetRate = rates[targetCurrency.toUpperCase()]
      if (!targetRate) {
        return NextResponse.json(
          { error: `Currency ${targetCurrency} not found` },
          { status: 400 }
        )
      }

      const convertedAmount = amount * targetRate
      return NextResponse.json({
        base: baseCurrency.toUpperCase(),
        target: targetCurrency.toUpperCase(),
        rate: targetRate,
        originalAmount: amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        timestamp: new Date().toISOString()
      })
    }

    // Return all rates with common currencies highlighted
    const commonCurrencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "SGD"]
    const commonRates: { [key: string]: number } = {}
    
    commonCurrencies.forEach(currency => {
      if (rates[currency]) {
        commonRates[currency] = rates[currency]
      }
    })

    return NextResponse.json({
      base: baseCurrency.toUpperCase(),
      rates: commonRates,
      allRates: rates,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Currency conversion error:", error)
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 500 }
    )
  }
}