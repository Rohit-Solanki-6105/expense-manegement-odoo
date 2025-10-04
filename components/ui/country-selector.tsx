"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface Country {
  name: string
  code: string
  currency?: string
}

const COUNTRIES: Country[] = [
  { name: "United States", code: "US", currency: "USD" },
  { name: "Canada", code: "CA", currency: "CAD" },
  { name: "United Kingdom", code: "GB", currency: "GBP" },
  { name: "Germany", code: "DE", currency: "EUR" },
  { name: "France", code: "FR", currency: "EUR" },
  { name: "Italy", code: "IT", currency: "EUR" },
  { name: "Spain", code: "ES", currency: "EUR" },
  { name: "Netherlands", code: "NL", currency: "EUR" },
  { name: "Belgium", code: "BE", currency: "EUR" },
  { name: "Austria", code: "AT", currency: "EUR" },
  { name: "Switzerland", code: "CH", currency: "CHF" },
  { name: "Norway", code: "NO", currency: "NOK" },
  { name: "Sweden", code: "SE", currency: "SEK" },
  { name: "Denmark", code: "DK", currency: "DKK" },
  { name: "Finland", code: "FI", currency: "EUR" },
  { name: "Japan", code: "JP", currency: "JPY" },
  { name: "South Korea", code: "KR", currency: "KRW" },
  { name: "China", code: "CN", currency: "CNY" },
  { name: "Hong Kong", code: "HK", currency: "HKD" },
  { name: "Singapore", code: "SG", currency: "SGD" },
  { name: "Australia", code: "AU", currency: "AUD" },
  { name: "New Zealand", code: "NZ", currency: "NZD" },
  { name: "Brazil", code: "BR", currency: "BRL" },
  { name: "Mexico", code: "MX", currency: "MXN" },
  { name: "Argentina", code: "AR", currency: "ARS" },
  { name: "Chile", code: "CL", currency: "CLP" },
  { name: "India", code: "IN", currency: "INR" },
  { name: "Russia", code: "RU", currency: "RUB" },
  { name: "South Africa", code: "ZA", currency: "ZAR" },
  { name: "Israel", code: "IL", currency: "ILS" },
  { name: "Turkey", code: "TR", currency: "TRY" },
  { name: "Thailand", code: "TH", currency: "THB" },
  { name: "Malaysia", code: "MY", currency: "MYR" },
  { name: "Indonesia", code: "ID", currency: "IDR" },
  { name: "Philippines", code: "PH", currency: "PHP" },
  { name: "Vietnam", code: "VN", currency: "VND" },
  { name: "Pakistan", code: "PK", currency: "PKR" },
  { name: "Bangladesh", code: "BD", currency: "BDT" },
  { name: "Nigeria", code: "NG", currency: "NGN" },
  { name: "Egypt", code: "EG", currency: "EGP" },
  { name: "Morocco", code: "MA", currency: "MAD" },
  { name: "Kenya", code: "KE", currency: "KES" },
  { name: "Ghana", code: "GH", currency: "GHS" },
  { name: "Ukraine", code: "UA", currency: "UAH" },
  { name: "Poland", code: "PL", currency: "PLN" },
  { name: "Czech Republic", code: "CZ", currency: "CZK" },
  { name: "Hungary", code: "HU", currency: "HUF" },
  { name: "Romania", code: "RO", currency: "RON" },
  { name: "Bulgaria", code: "BG", currency: "BGN" },
  { name: "Croatia", code: "HR", currency: "EUR" },
  { name: "Slovenia", code: "SI", currency: "EUR" },
  { name: "Slovakia", code: "SK", currency: "EUR" },
  { name: "Lithuania", code: "LT", currency: "EUR" },
  { name: "Latvia", code: "LV", currency: "EUR" },
  { name: "Estonia", code: "EE", currency: "EUR" },
]

interface CountrySelectorProps {
  value?: string
  onSelect: (country: Country) => void
  placeholder?: string
}

export function CountrySelector({ value, onSelect, placeholder = "Select country..." }: CountrySelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedCountry = COUNTRIES.find(country => country.name === value)

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
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search countries..." />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {COUNTRIES.map((country) => (
              <CommandItem
                key={country.code}
                value={country.name}
                onSelect={() => {
                  onSelect(country)
                  setOpen(false)
                }}
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
                    {country.code} • {country.currency}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}