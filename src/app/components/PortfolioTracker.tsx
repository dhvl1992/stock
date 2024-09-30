'use client'

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type StockEntry = {
  _id: string
  date: string
  stock: string
  quantity: number
  buyingPrice: number
  currentPrice: number
  totalInvested: number
  totalCurrent: number
  pnl: number
}

export default function PortfolioTracker() {
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [newEntry, setNewEntry] = useState<Omit<StockEntry, '_id' | 'totalInvested' | 'totalCurrent' | 'pnl'>>({
    date: '',
    stock: '',
    quantity: 0,
    buyingPrice: 0,
    currentPrice: 0,
  })
  const [startingAmount, setStartingAmount] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const response = await fetch('/api/portfolio')
    const data = await response.json()
    setEntries(data.entries)
    setStartingAmount(data.portfolio?.startingAmount || 0)
  }

  const addEntry = async () => {
    const totalInvested = newEntry.quantity * newEntry.buyingPrice
    const totalCurrent = newEntry.quantity * newEntry.currentPrice
    const pnl = totalCurrent - totalInvested

    const response = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'entry',
        data: {
          ...newEntry,
          totalInvested,
          totalCurrent,
          pnl,
        },
      }),
    })

    if (response.ok) {
      fetchData()
      setNewEntry({
        date: '',
        stock: '',
        quantity: 0,
        buyingPrice: 0,
        currentPrice: 0,
      })
    }
  }

  const updateStartingAmount = async () => {
    const response = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'portfolio',
        data: { startingAmount },
      }),
    })

    if (response.ok) {
      fetchData()
    }
  }

  const totalPnL = entries.reduce((sum, entry) => sum + entry.pnl, 0)
  const finalPortfolioAmount = startingAmount + totalPnL

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const datewisePnL = sortedEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = 0
    }
    acc[entry.date] += entry.pnl
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(datewisePnL).map(([date, pnl]) => ({ date, pnl }))

  const latestDate = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].date : 'N/A'

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DUP Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Starting Amount</h2>
          <label htmlFor="startingAmount" className="block mb-1">Starting Amount</label>
          <input
            id="startingAmount"
            type="number"
            value={startingAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartingAmount(Number(e.target.value))}
            onBlur={updateStartingAmount}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Total P&L</h2>
          <p className="text-2xl font-semibold">{totalPnL.toFixed(2)}</p>
        </div>
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Final Portfolio Amount</h2>
          <p className="text-2xl font-semibold">{finalPortfolioAmount.toFixed(2)}</p>
          <p className="text-sm text-gray-600">As of {latestDate}</p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Add New Entry</h2>
        <div className="grid grid-cols-5 gap-2">
          <div>
            <label htmlFor="date" className="block mb-1">Date</label>
            <input
              id="date"
              type="date"
              value={newEntry.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, date: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="stock" className="block mb-1">Stock</label>
            <input
              id="stock"
              type="text"
              value={newEntry.stock}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, stock: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block mb-1">Quantity</label>
            <input
              id="quantity"
              type="number"
              value={newEntry.quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, quantity: Number(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="buyingPrice" className="block mb-1">Buying Price</label>
            <input
              id="buyingPrice"
              type="number"
              value={newEntry.buyingPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, buyingPrice: Number(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="currentPrice" className="block mb-1">Current Price</label>
            <input
              id="currentPrice"
              type="number"
              value={newEntry.currentPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, currentPrice: Number(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <button onClick={addEntry} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add Entry</button>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Buying Price</th>
            <th className="border p-2">Current Price</th>
            <th className="border p-2">Total Invested</th>
            <th className="border p-2">Total Current</th>
            <th className="border p-2">P&L</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry) => (
            <tr key={entry._id}>
              <td className="border p-2">{entry.date}</td>
              <td className="border p-2">{entry.stock}</td>
              <td className="border p-2">{entry.quantity}</td>
              <td className="border p-2">{entry.buyingPrice.toFixed(2)}</td>
              <td className="border p-2">{entry.currentPrice.toFixed(2)}</td>
              <td className="border p-2">{entry.totalInvested.toFixed(2)}</td>
              <td className="border p-2">{entry.totalCurrent.toFixed(2)}</td>
              <td className="border p-2">{entry.pnl.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Datewise P&L Summary</h2>
        <table className="w-full border-collapse border">
          <thead>
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Total P&L</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map(({ date, pnl }) => (
              <tr key={date}>
                <td className="border p-2">{date}</td>
                <td className="border p-2">{pnl.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pnl" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}