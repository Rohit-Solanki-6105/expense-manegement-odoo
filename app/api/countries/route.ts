import { NextRequest, NextResponse } from 'next/server'

interface Country {
  name: {
    common: string
    official: string
  }
  currencies?: {
    [key: string]: {
      name: string
      symbol?: string
    }
  }
  cca2: string // ISO 3166-1 alpha-2 country code
}

interface ProcessedCountry {
  name: string
  code: string
  currency: string | null
  currencySymbol: string | null
}

export async function GET() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies,cca2')
    
    if (!response.ok) {
      throw new Error('Failed to fetch countries')
    }

    const countries: Country[] = await response.json()
    
    // Process and sort the countries
    const processedCountries: ProcessedCountry[] = countries
      .map(country => {
        const primaryCurrency = country.currencies 
          ? Object.values(country.currencies)[0] 
          : null

        return {
          name: country.name.common,
          code: country.cca2,
          currency: primaryCurrency?.name || null,
          currencySymbol: primaryCurrency?.symbol || null
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ countries: processedCountries })
  } catch (error) {
    console.error('Error fetching countries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
}