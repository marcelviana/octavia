import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Forward the request to our setlists API
    const setlistsResponse = await fetch(`${req.nextUrl.origin}/api/setlists`, {
      headers: {
        'Cookie': req.headers.get('cookie') || '',
      },
    })

    const data = await setlistsResponse.json()
    
    return NextResponse.json({
      status: setlistsResponse.status,
      statusText: setlistsResponse.statusText,
      data,
    })
  } catch (error) {
    return NextResponse.json({ error: "Test failed", details: error }, { status: 500 })
  }
} 