'use client'

import React from 'react'

interface CustomDatePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export default function CustomDatePicker({
  value,
  onChange,
  label,
  className = ""
}: CustomDatePickerProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  )
}