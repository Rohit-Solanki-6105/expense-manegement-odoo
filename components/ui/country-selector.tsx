"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface Country {
  name: string
  code: string
  currency: string
  symbol: string
}

const COUNTRIES: Country[] = [
  { name: "United States", code: "US", currency: "USD", symbol: "$" },
  { name: "Canada", code: "CA", currency: "CAD", symbol: "C$" },
  { name: "United Kingdom", code: "GB", currency: "GBP", symbol: "£" },
  { name: "Germany", code: "DE", currency: "EUR", symbol: "€" },
  { name: "France", code: "FR", currency: "EUR", symbol: "€" },
  { name: "Italy", code: "IT", currency: "EUR", symbol: "€" },
  { name: "Spain", code: "ES", currency: "EUR", symbol: "€" },
  { name: "Netherlands", code: "NL", currency: "EUR", symbol: "€" },
  { name: "Belgium", code: "BE", currency: "EUR", symbol: "€" },
  { name: "Austria", code: "AT", currency: "EUR", symbol: "€" },
  { name: "Switzerland", code: "CH", currency: "CHF", symbol: "Fr" },
  { name: "Norway", code: "NO", currency: "NOK", symbol: "kr" },
  { name: "Sweden", code: "SE", currency: "SEK", symbol: "kr" },
  { name: "Denmark", code: "DK", currency: "DKK", symbol: "kr" },
  { name: "Finland", code: "FI", currency: "EUR", symbol: "€" },
  { name: "Japan", code: "JP", currency: "JPY", symbol: "¥" },
  { name: "South Korea", code: "KR", currency: "KRW", symbol: "₩" },
  { name: "China", code: "CN", currency: "CNY", symbol: "¥" },
  { name: "Hong Kong", code: "HK", currency: "HKD", symbol: "HK$" },
  { name: "Singapore", code: "SG", currency: "SGD", symbol: "S$" },
  { name: "Australia", code: "AU", currency: "AUD", symbol: "A$" },
  { name: "New Zealand", code: "NZ", currency: "NZD", symbol: "NZ$" },
  { name: "Brazil", code: "BR", currency: "BRL", symbol: "R$" },
  { name: "Mexico", code: "MX", currency: "MXN", symbol: "$" },
  { name: "Argentina", code: "AR", currency: "ARS", symbol: "$" },
  { name: "Chile", code: "CL", currency: "CLP", symbol: "$" },
  { name: "India", code: "IN", currency: "INR", symbol: "₹" },
  { name: "Russia", code: "RU", currency: "RUB", symbol: "₽" },
  { name: "South Africa", code: "ZA", currency: "ZAR", symbol: "R" },
  { name: "Israel", code: "IL", currency: "ILS", symbol: "₪" },
  { name: "Turkey", code: "TR", currency: "TRY", symbol: "₺" },
  { name: "Thailand", code: "TH", currency: "THB", symbol: "฿" },
  { name: "Malaysia", code: "MY", currency: "MYR", symbol: "RM" },
  { name: "Indonesia", code: "ID", currency: "IDR", symbol: "Rp" },
  { name: "Philippines", code: "PH", currency: "PHP", symbol: "₱" },
  { name: "Vietnam", code: "VN", currency: "VND", symbol: "₫" },
  { name: "Pakistan", code: "PK", currency: "PKR", symbol: "₨" },
  { name: "Bangladesh", code: "BD", currency: "BDT", symbol: "৳" },
  { name: "Nigeria", code: "NG", currency: "NGN", symbol: "₦" },
  { name: "Egypt", code: "EG", currency: "EGP", symbol: "£" },
  { name: "Morocco", code: "MA", currency: "MAD", symbol: "MAD" },
  { name: "Kenya", code: "KE", currency: "KES", symbol: "KSh" },
  { name: "Ghana", code: "GH", currency: "GHS", symbol: "₵" },
  { name: "Ukraine", code: "UA", currency: "UAH", symbol: "₴" },
  { name: "Poland", code: "PL", currency: "PLN", symbol: "zł" },
  { name: "Czech Republic", code: "CZ", currency: "CZK", symbol: "Kč" },
  { name: "Hungary", code: "HU", currency: "HUF", symbol: "Ft" },
  { name: "Romania", code: "RO", currency: "RON", symbol: "lei" },
  { name: "Bulgaria", code: "BG", currency: "BGN", symbol: "лв" },
  { name: "Croatia", code: "HR", currency: "EUR", symbol: "€" },
  { name: "Slovenia", code: "SI", currency: "EUR", symbol: "€" },
  { name: "Slovakia", code: "SK", currency: "EUR", symbol: "€" },
  { name: "Lithuania", code: "LT", currency: "EUR", symbol: "€" },
  { name: "Latvia", code: "LV", currency: "EUR", symbol: "€" },
  { name: "Estonia", code: "EE", currency: "EUR", symbol: "€" },
]

interface CountrySelectorProps {
  value?: string
  onSelect: (country: Country) => void
  placeholder?: string
}

export function CountrySelector({ value, onSelect, placeholder = "Select country..." }: CountrySelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const selectedCountry = COUNTRIES.find(country => country.name === value)

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.currency.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (country: Country) => {
    onSelect(country)
    setOpen(false)
    setSearchTerm("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCountry ? selectedCountry.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-auto">
          {filteredCountries.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No country found.
            </div>
          ) : (
            filteredCountries.map((country) => (
              <div
                key={country.code}
                onClick={() => handleSelect(country)}
                className="flex items-center p-2 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{country.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {country.code} • {country.currency} ({country.symbol})
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}