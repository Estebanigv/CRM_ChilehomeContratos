import React from 'react'

export default function DashboardClientMinimal() {
  return (
    <div className="p-4">
      <h1>Minimal Dashboard - Testing Syntax</h1>
      <div className="grid gap-4">
        {[1,2,3].map((item) => (
          <div key={item} className="p-4 border rounded">
            <div className="text-sm">Item {item}</div>
          </div>
        ))}
      </div>
    </div>
  )
}