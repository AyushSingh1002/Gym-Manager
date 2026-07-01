#!/usr/bin/env node

/**
 * Razorpay Credential Tester
 * Run: node test-razorpay.js
 * 
 * This tests your Razorpay API credentials directly
 */

const keyId = "rzp_test_T7woAClFcx1TVp";
const keySecret = "5yrVXq8QVdIx5NKglNWx6TnJ";

console.log("=".repeat(60));
console.log("RAZORPAY CREDENTIAL TESTER");
console.log("=".repeat(60));

console.log("\n1. Credential Format Check:");
console.log(`   Key ID: ${keyId}`);
console.log(`   Key ID Length: ${keyId.length}`);
console.log(`   Key ID starts with 'rzp_test_': ${keyId.startsWith("rzp_test_") ? "✓" : "✗"}`);
console.log(`\n   Key Secret Length: ${keySecret.length}`);
console.log(`   Key Secret chars: ${keySecret.substring(0, 10)}...`);

const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
console.log(`\n2. Basic Auth Header Generated:`);
console.log(`   ${auth.substring(0, 30)}...`);

// Test 1: GET request (list payments)
console.log("\n3. Testing GET /v1/payments...");
fetch("https://api.razorpay.com/v1/payments", {
  headers: { Authorization: `Basic ${auth}` },
})
  .then((res) => {
    console.log(`   Status: ${res.status} ${res.statusText}`);
    return res.text().then((text) => ({ res, text }));
  })
  .then(({ res, text }) => {
    if (res.ok) {
      console.log(`   ✓ GET works (can list payments)`);
    } else {
      console.log(`   ✗ GET failed`);
      try {
        const json = JSON.parse(text);
        console.log(`   Error: ${json.error?.description || text}`);
      } catch {
        console.log(`   Error: ${text}`);
      }
    }

    // Test 2: POST request (create order)
    console.log("\n4. Testing POST /v1/orders...");
    return fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: 99900, // 999 INR in paise
        currency: "INR",
        receipt: `test_${Date.now()}`,
      }),
    });
  })
  .then((res) => {
    console.log(`   Status: ${res.status} ${res.statusText}`);
    return res.text().then((text) => ({ res, text }));
  })
  .then(({ res, text }) => {
    if (res.ok) {
      console.log(`   ✓ POST works (can create orders)`);
      const order = JSON.parse(text);
      console.log(`   Order ID: ${order.id}`);
    } else {
      console.log(`   ✗ POST failed`);
      try {
        const json = JSON.parse(text);
        console.log(`   Error Code: ${json.error?.code}`);
        console.log(`   Error: ${json.error?.description || text}`);
      } catch {
        console.log(`   Error: ${text}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("RECOMMENDATIONS:");
    console.log("=".repeat(60));
    console.log("\nIf POST /v1/orders is failing:");
    console.log("1. Check if credentials contain extra spaces/quotes");
    console.log("2. Verify keys at: https://dashboard.razorpay.com/app/keys");
    console.log("3. Make sure you're using TEST keys (rzp_test_*)");
    console.log("4. Regenerate keys if they look suspicious");
    console.log("5. Check for IP whitelist restrictions in your account");
    console.log("6. Contact Razorpay support if POST consistently fails");
  })
  .catch((err) => {
    console.error("Network error:", err.message);
  });
