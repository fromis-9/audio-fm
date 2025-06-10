import { useState } from 'react'

function DateRangeSelector({ fromDate, toDate, onFromDateChange, onToDateChange, disabled = false }) {
  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  // Convert string to Date object
  const handleFromDateChange = (e) => {
    const dateStr = e.target.value
    if (dateStr) {
      const date = new Date(dateStr + 'T00:00:00')
      onFromDateChange(date)
    } else {
      onFromDateChange(null)
    }
  }

  const handleToDateChange = (e) => {
    const dateStr = e.target.value
    if (dateStr) {
      const date = new Date(dateStr + 'T23:59:59')
      onToDateChange(date)
    } else {
      onToDateChange(null)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="fromDate" className="block text-sm font-medium text-dark-200 mb-2">
          From
        </label>
        <div className="date-input-wrapper">
          <input
            type="date"
            id="fromDate"
            value={formatDateForInput(fromDate)}
            onChange={handleFromDateChange}
            max={today}
            disabled={disabled}
            className="input-field w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="toDate" className="block text-sm font-medium text-dark-200 mb-2">
          To
        </label>
        <div className="date-input-wrapper">
          <input
            type="date"
            id="toDate"
            value={formatDateForInput(toDate)}
            onChange={handleToDateChange}
            max={today}
            min={fromDate ? formatDateForInput(fromDate) : undefined}
            disabled={disabled}
            className="input-field w-full"
          />
        </div>
      </div>
    </div>
  )
}

export default DateRangeSelector 