import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  const client = await clientPromise
  const db = client.db("dup_portfolio")
  const entries = await db.collection("entries").find({}).toArray()
  const portfolio = await db.collection("portfolio").findOne({})
  return NextResponse.json({ entries, portfolio })
}

export async function POST(request: Request) {
  const client = await clientPromise
  const db = client.db("dup_portfolio")
  const body = await request.json()
  const { type, data } = body

  if (type === 'entry') {
    const result = await db.collection("entries").insertOne(data)
    return NextResponse.json(result)
  } else if (type === 'portfolio') {
    const result = await db.collection("portfolio").updateOne(
      { id: 1 },
      { $set: data },
      { upsert: true }
    )
    return NextResponse.json(result)
  }

  return NextResponse.error()
}