'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        <Card>
          <CardHeader>
            <CardTitle>Starting Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="startingAmount">Starting Amount</Label>
            <Input
              id="startingAmount"
              type="number"
              value={startingAmount}
              onChange={(e) => setStartingAmount(Number(e.target.value))}
              onBlur={updateStartingAmount}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalPnL.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Final Portfolio Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{finalPortfolioAmount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">As of {latestDate}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Add New Entry</h2>
        <div className="grid grid-cols-5 gap-2">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="text"
              value={newEntry.stock}
              onChange={(e) => setNewEntry({ ...newEntry, stock: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={newEntry.quantity}
              onChange={(e) => setNewEntry({ ...newEntry, quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="buyingPrice">Buying Price</Label>
            <Input
              id="buyingPrice"
              type="number"
              value={newEntry.buyingPrice}
              onChange={(e) => setNewEntry({ ...newEntry, buyingPrice: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="currentPrice">Current Price</Label>
            <Input
              id="currentPrice"
              type="number"
              value={newEntry.currentPrice}
              onChange={(e) => setNewEntry({ ...newEntry, currentPrice: Number(e.target.value) })}
            />
          </div>
        </div>
        <Button onClick={addEntry} className="mt-2">Add Entry</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Buying Price</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>Total Invested</TableHead>
            <TableHead>Total Current</TableHead>
            <TableHead>P&L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.map((entry) => (
            <TableRow key={entry._id}>
              <TableCell>{entry.date}</TableCell>
              <TableCell>{entry.stock}</TableCell>
              <TableCell>{entry.quantity}</TableCell>
              <TableCell>{entry.buyingPrice.toFixed(2)}</TableCell>
              <TableCell>{entry.currentPrice.toFixed(2)}</TableCell>
              <TableCell>{entry.totalInvested.toFixed(2)}</TableCell>
              <TableCell>{entry.totalCurrent.toFixed(2)}</TableCell>
              <TableCell>{entry.pnl.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Datewise P&L Summary</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Total P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chartData.map(({ date, pnl }) => (
              <TableRow key={date}>
                <TableCell>{date}</TableCell>
                <TableCell>{pnl.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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