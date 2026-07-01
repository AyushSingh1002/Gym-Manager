import { NextRequest, NextResponse } from "next/server"

export async function GET(_request: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { 
          status: "error", 
          message: "Razorpay credentials not configured in environment variables",
          keyIdSet: !!keyId,
          keySecretSet: !!keySecret,
        },
        { status: 400 }
      )
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
    
    // Test 1: GET /v1/payments (List payments)
    console.log("Test 1: Checking GET /v1/payments...")
    const getResponse = await fetch("https://api.razorpay.com/v1/payments", {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
      },
    })

    const getTest = {
      status: getResponse.status,
      ok: getResponse.ok,
      statusText: getResponse.statusText,
    }

    // Test 2: POST /v1/orders (Create order)
    console.log("Test 2: Checking POST /v1/orders...")
    const postResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: 99900, // 999 INR in paise
        currency: "INR",
        receipt: `test_${Date.now()}`,
      }),
    })

    const postResponseText = await postResponse.text()
    let postResponseJson
    try {
      postResponseJson = JSON.parse(postResponseText)
    } catch {
      postResponseJson = { raw: postResponseText }
    }

    const postTest = {
      status: postResponse.status,
      ok: postResponse.ok,
      statusText: postResponse.statusText,
      response: postResponseJson,
    }

    // Test 3: Verify credentials format
    const credentialTest = {
      keyIdLength: keyId.length,
      keyIdStart: keyId.substring(0, 8),
      keySecretLength: keySecret.length,
      authHeaderLength: auth.length,
      basicAuthFormat: auth.substring(0, 20) + "...",
    }

    return NextResponse.json({
      status: "completed",
      message: "Razorpay credential diagnostics",
      credentials: credentialTest,
      tests: {
        get_payments: getTest,
        post_orders: postTest,
      },
      summary: {
        getPaymentsWorking: getTest.ok,
        postOrdersWorking: postTest.ok,
        issue: !postTest.ok ? `POST /v1/orders failed with ${postTest.status}: ${postTest.response.error?.description || postResponseText}` : "All tests passed",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to verify Razorpay credentials",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
