"use client"

import { useState, useEffect } from 'react'

interface Country {
  name: string
  code: string
  currency: string | null
  currencySymbol: string | null
}

interface CountrySelectorProps {
  value: string
  onChange: (country: Country | null) => void
  className?: string
}

export function CountrySelector({ value, onChange, className }: CountrySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/countries')
        if (!response.ok) {
          throw new Error('Failed to fetch countries')
        }
        const data = await response.json()
        setCountries(data.countries)
      } catch (error) {
        console.error('Error fetching countries:', error)
        setError('Failed to load countries')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCountries()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value
    const selectedCountry = countries.find(country => country.code === selectedCode)
    onChange(selectedCountry || null)
  }

  if (isLoading) {
    return (
      <select disabled className={`${className} opacity-50 cursor-not-allowed`}>
        <option>Loading countries...</option>
      </select>
    )
  }

  if (error) {
    return (
      <select disabled className={`${className} opacity-50 cursor-not-allowed`}>
        <option>Error loading countries</option>
      </select>
    )
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className={className}
      required
    >
      <option value="">Select your country</option>
      {countries.map(country => (
        <option key={country.code} value={country.code}>
          {country.name}
          {country.currency && ` (${country.currency})`}
        </option>
      ))}
    </select>
  )
}