declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false

  if (window.Razorpay) return true

  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
  if (existingScript) {
    await new Promise<void>((resolve) => {
      const check = () => {
        if (window.Razorpay) {
          resolve()
        } else {
          window.setTimeout(check, 50)
        }
      }
      check()
    })
    return Boolean(window.Razorpay)
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay script"))
    document.body.appendChild(script)
  })

  return Boolean(window.Razorpay)
}
