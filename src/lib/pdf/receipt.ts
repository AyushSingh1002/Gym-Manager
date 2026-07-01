import { PDFDocument, StandardFonts, rgb, PDFPage, degrees } from "pdf-lib"

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 48
const CONTENT_WIDTH = A4_WIDTH - 2 * MARGIN

// ─── Palette ──────────────────────────────────────────────────
const PRIMARY = rgb(0.29, 0.24, 0.85) // indigo
const PRIMARY_SOFT = rgb(0.93, 0.92, 0.99)
const INK = rgb(0.09, 0.11, 0.16) // near-black navy
const SLATE = rgb(0.38, 0.42, 0.49) // secondary text
const MUTED = rgb(0.58, 0.61, 0.67) // tertiary / labels
const CARD_BG = rgb(0.975, 0.978, 0.985)
const LINE = rgb(0.88, 0.89, 0.92)
const WHITE = rgb(1, 1, 1)
const SUCCESS = rgb(0.06, 0.55, 0.38)
const SUCCESS_SOFT = rgb(0.9, 0.97, 0.94)
const ERROR = rgb(0.78, 0.22, 0.24)
const ERROR_SOFT = rgb(0.98, 0.92, 0.92)

interface ReceiptMember {
  id: string
  memberId: string
  firstName: string
  lastName: string
  phone: string
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  gender?: string | null
  dateOfBirth?: Date | null
}

interface ReceiptMembership {
  id: string
  plan: string
  startDate: Date
  endDate: Date
  status: string
  discount?: number
}

interface ReceiptPayment {
  id: string
  receiptNo?: string | null
  amount: number
  method: string
  status: string
  date: Date
  razorpayPaymentId?: string | null
  razorpayOrderId?: string | null
  notes?: string | null
}

interface GymSettings {
  name: string
  tagline?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  currency: string
  gstNumber?: string | null
  logo?: string | null
}

interface ReceiptData {
  payment: ReceiptPayment
  member: ReceiptMember
  membership?: ReceiptMembership | null
  settings: GymSettings
  adminName: string
}

type Fonts = { bold: any; regular: any }

// ─── Formatting helpers ───────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    HALF_YEARLY: "Half Yearly",
    YEARLY: "Yearly",
    CUSTOM: "Custom",
  }
  return labels[plan] || plan
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PAID: "Paid",
    PENDING: "Pending",
    FAILED: "Failed",
    REFUNDED: "Refunded",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
  }
  return labels[status] || status
}

function getMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
    ONLINE: "Online",
  }
  return labels[method] || method
}

// ─── Low-level drawing primitives ─────────────────────────────

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: any,
  color = INK
) {
  page.drawText(text, { x, y, size, font, color })
}

function textWidth(font: any, text: string, size: number) {
  return font.widthOfTextAtSize(text, size)
}

function drawRightAlignedText(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: any,
  color = INK
) {
  const w = textWidth(font, text, size)
  drawText(page, text, rightX - w, y, size, font, color)
}

/** Section label: small caps-style muted heading with a short accent underline */
function drawSectionLabel(page: PDFPage, y: number, title: string, fonts: Fonts) {
  drawText(page, title.toUpperCase(), MARGIN, y, 9.5, fonts.bold, PRIMARY)
  page.drawRectangle({
    x: MARGIN,
    y: y - 6,
    width: 22,
    height: 1.4,
    color: PRIMARY,
  })
}

function drawHairline(page: PDFPage, y: number, color = LINE) {
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4_WIDTH - MARGIN, y },
    thickness: 1,
    color,
  })
}

/** A labeled field: small muted label above, value below. Returns nothing; caller manages y. */
function drawField(
  page: PDFPage,
  x: number,
  y: number,
  label: string,
  value: string,
  fonts: Fonts,
  valueSize = 10
) {
  drawText(page, label.toUpperCase(), x, y, 7.5, fonts.regular, MUTED)
  drawText(page, value, x, y - 13, valueSize, fonts.bold, INK)
}

/** Renders a two-column row of fields at a shared baseline */
function drawFieldRow(
  page: PDFPage,
  y: number,
  fields: { label: string; value: string }[],
  fonts: Fonts,
  columns = 2
) {
  const colWidth = CONTENT_WIDTH / columns
  fields.forEach((f, i) => {
    const x = MARGIN + (i % columns) * colWidth
    drawField(page, x, y, f.label, f.value, fonts)
  })
}

/** Small pill/chip, e.g. status badge */
function drawChip(
  page: PDFPage,
  rightX: number,
  y: number,
  text: string,
  bg: ReturnType<typeof rgb>,
  fg: ReturnType<typeof rgb>,
  fonts: Fonts
) {
  const paddingX = 10
  const size = 8.5
  const w = textWidth(fonts.bold, text.toUpperCase(), size) + paddingX * 2
  const h = 18
  const x = rightX - w
  page.drawRectangle({ x, y, width: w, height: h, color: bg })
  drawText(page, text.toUpperCase(), x + paddingX, y + 6, size, fonts.bold, fg)
  return w
}

// ─── Document ──────────────────────────────────────────────────

export async function generateReceiptPDF(data: ReceiptData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fonts: Fonts = { bold: boldFont, regular: regularFont }

  const isPaid = data.payment.status === "PAID"

  // Watermark
  if (isPaid) {
    const wmText = "PAID"
    const wmSize = 110
    const wmWidth = textWidth(fonts.bold, wmText, wmSize)
    page.drawText(wmText, {
      x: (A4_WIDTH - wmWidth) / 2,
      y: A4_HEIGHT / 2 - 40,
      size: wmSize,
      font: fonts.bold,
      color: rgb(0.93, 0.95, 0.94),
      opacity: 0.5,
      rotate: degrees(-28),
    })
  }

  // ─── Top accent bar ──────────────────────────────────────
  page.drawRectangle({ x: 0, y: A4_HEIGHT - 6, width: A4_WIDTH, height: 6, color: PRIMARY })

  let y = A4_HEIGHT - 46

  // ─── HEADER: brand (left) + receipt meta (right) ─────────
  const headerTop = y
  drawText(page, data.settings.name, MARGIN, y, 21, fonts.bold, INK)
  y -= 15
  if (data.settings.tagline) {
    drawText(page, data.settings.tagline, MARGIN, y, 9, fonts.regular, SLATE)
    y -= 13
  }

  const contactParts: string[] = []
  if (data.settings.address) contactParts.push(data.settings.address)
  if (data.settings.phone) contactParts.push(data.settings.phone)
  if (data.settings.email) contactParts.push(data.settings.email)
  if (contactParts.length) {
    drawText(page, contactParts.join("   •   "), MARGIN, y, 8, fonts.regular, MUTED)
    y -= 12
  }
  if (data.settings.website) {
    drawText(page, data.settings.website, MARGIN, y, 8, fonts.regular, MUTED)
    y -= 12
  }
  if (data.settings.gstNumber) {
    drawText(page, `GSTIN: ${data.settings.gstNumber}`, MARGIN, y, 8, fonts.regular, MUTED)
    y -= 12
  }

  // Right column: RECEIPT title, number, date, status chip
  const rightX = A4_WIDTH - MARGIN
  drawRightAlignedText(page, "RECEIPT", rightX, headerTop, 15, fonts.bold, PRIMARY)
  const receiptNo = data.payment.receiptNo || data.payment.id.slice(0, 8).toUpperCase()
  drawRightAlignedText(page, `#${receiptNo}`, rightX, headerTop - 16, 10, fonts.bold, INK)
  drawRightAlignedText(page, formatDate(data.payment.date), rightX, headerTop - 30, 9, fonts.regular, SLATE)

  const statusColorBg = isPaid ? SUCCESS_SOFT : ERROR_SOFT
  const statusColorFg = isPaid ? SUCCESS : ERROR
  drawChip(page, rightX, headerTop - 52, getStatusLabel(data.payment.status), statusColorBg, statusColorFg, fonts)

  y = Math.min(y, headerTop - 68) - 14
  drawHairline(page, y)
  y -= 26

  // ─── MEMBER INFORMATION ───────────────────────────────────
  drawSectionLabel(page, y, "Member Information", fonts)
  y -= 22

  const memberName = `${data.member.firstName} ${data.member.lastName}`
  const memberAddressFull = data.member.address
    ? [data.member.address, data.member.city, data.member.state, data.member.pincode].filter(Boolean).join(", ")
    : "—"
  const memberAddress =
    memberAddressFull.length > 46 ? memberAddressFull.slice(0, 46) + "…" : memberAddressFull

  drawFieldRow(
    page, y,
    [
      { label: "Name", value: memberName },
      { label: "Member ID", value: data.member.memberId },
    ],
    fonts
  )
  y -= 30
  drawFieldRow(
    page, y,
    [
      { label: "Phone", value: data.member.phone || "—" },
      { label: "Email", value: data.member.email || "—" },
    ],
    fonts
  )
  y -= 30
  drawFieldRow(
    page, y,
    [
      { label: "Address", value: memberAddress },
      { label: "Gender", value: data.member.gender || "—" },
    ],
    fonts
  )

  y -= 26
  drawHairline(page, y)
  y -= 26

  // ─── MEMBERSHIP DETAILS ───────────────────────────────────
  drawSectionLabel(page, y, "Membership Details", fonts)
  y -= 22

  if (data.membership) {
    const diffMs = data.membership.endDate.getTime() - data.membership.startDate.getTime()
    const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30))
    const duration =
      diffMonths >= 1
        ? `${diffMonths} Month${diffMonths > 1 ? "s" : ""}`
        : `${Math.round(diffMs / (1000 * 60 * 60 * 24))} Days`

    drawFieldRow(
      page, y,
      [
        { label: "Plan", value: getPlanLabel(data.membership.plan) },
        { label: "Duration", value: duration },
      ],
      fonts
    )
    y -= 30
    drawFieldRow(
      page, y,
      [
        { label: "Start Date", value: formatDate(data.membership.startDate) },
        { label: "End Date", value: formatDate(data.membership.endDate) },
      ],
      fonts
    )
    y -= 30
    drawFieldRow(
      page, y,
      [{ label: "Status", value: getStatusLabel(data.membership.status) }],
      fonts,
      1
    )
  } else {
    drawText(page, "No membership linked to this payment.", MARGIN, y, 9.5, fonts.regular, MUTED)
    y -= 10
  }

  y -= 22
  drawHairline(page, y)
  y -= 26

  // ─── PAYMENT DETAILS TABLE ─────────────────────────────────
  drawSectionLabel(page, y, "Payment Details", fonts)
  y -= 24

  // Header row
  const tableTop = y + 8
  page.drawRectangle({ x: MARGIN, y: tableTop - 22, width: CONTENT_WIDTH, height: 24, color: INK })
  drawText(page, "DESCRIPTION", MARGIN + 12, tableTop - 15, 8.5, fonts.bold, WHITE)
  drawRightAlignedText(page, `AMOUNT (${data.settings.currency || "INR"})`, A4_WIDTH - MARGIN - 12, tableTop - 15, 8.5, fonts.bold, WHITE)
  y = tableTop - 22 - 6

  const planLabel = data.membership ? getPlanLabel(data.membership.plan) : "Membership Fee"
  const discountAmount = data.membership?.discount || 0
  const subtotal = data.payment.amount
  const grandTotal = subtotal - discountAmount

  const rows: { label: string; value: string; muted?: boolean }[] = [
    { label: planLabel, value: formatCurrency(subtotal) },
  ]
  if (discountAmount > 0) {
    rows.push({ label: "Discount", value: `− ${formatCurrency(discountAmount)}`, muted: true })
  }

  let rowY = y - 14
  let stripe = false
  for (const row of rows) {
    if (stripe) {
      page.drawRectangle({ x: MARGIN, y: rowY - 6, width: CONTENT_WIDTH, height: 20, color: CARD_BG })
    }
    drawText(page, row.label, MARGIN + 12, rowY, 9.5, fonts.regular, row.muted ? SLATE : INK)
    drawRightAlignedText(page, row.value, A4_WIDTH - MARGIN - 12, rowY, 9.5, fonts.regular, row.muted ? SLATE : INK)
    rowY -= 20
    stripe = !stripe
  }

  rowY -= 4
  drawHairline(page, rowY + 8, LINE)
  rowY -= 6

  // Grand total band
  page.drawRectangle({ x: MARGIN, y: rowY - 12, width: CONTENT_WIDTH, height: 30, color: PRIMARY_SOFT })
  page.drawRectangle({ x: MARGIN, y: rowY - 12, width: 3, height: 30, color: PRIMARY })
  drawText(page, "GRAND TOTAL", MARGIN + 15, rowY - 3, 10, fonts.bold, PRIMARY)
  drawRightAlignedText(page, formatCurrency(grandTotal), A4_WIDTH - MARGIN - 12, rowY - 3, 13, fonts.bold, PRIMARY)
  y = rowY - 12 - 20

  // Method + status line
  drawText(page, "Payment Method", MARGIN, y, 7.5, fonts.regular, MUTED)
  drawText(page, getMethodLabel(data.payment.method), MARGIN, y - 12, 10, fonts.bold, INK)

  const midX = MARGIN + CONTENT_WIDTH / 2
  drawText(page, "Payment Status", midX, y, 7.5, fonts.regular, MUTED)
  drawText(page, getStatusLabel(data.payment.status), midX, y - 12, 10, fonts.bold, isPaid ? SUCCESS : ERROR)
  y -= 30

  // ─── RAZORPAY DETAILS ─────────────────────────────────────
  if (data.payment.razorpayPaymentId || data.payment.razorpayOrderId) {
    drawHairline(page, y)
    y -= 24
    drawSectionLabel(page, y, "Online Payment Reference", fonts)
    y -= 22

    const refFields = []
    if (data.payment.razorpayPaymentId) {
      refFields.push({ label: "Razorpay Payment ID", value: data.payment.razorpayPaymentId })
    }
    if (data.payment.razorpayOrderId) {
      refFields.push({ label: "Razorpay Order ID", value: data.payment.razorpayOrderId })
    }
    drawFieldRow(page, y, refFields, fonts, refFields.length > 1 ? 2 : 1)
    y -= 30
  }

  // ─── FOOTER ────────────────────────────────────────────────
  const footerY = 150
  drawHairline(page, footerY)

  drawText(page, "Thank you for choosing " + data.settings.name + ".", MARGIN, footerY - 22, 11.5, fonts.bold, PRIMARY)
  drawText(
    page,
    "This is a computer-generated receipt and does not require a physical signature.",
    MARGIN,
    footerY - 37,
    8,
    fonts.regular,
    MUTED
  )

  // Signature line
  const sigY = footerY - 80
  page.drawLine({ start: { x: MARGIN, y: sigY }, end: { x: MARGIN + 140, y: sigY }, thickness: 1, color: LINE })
  drawText(page, "Authorized Signature", MARGIN, sigY - 12, 8, fonts.regular, MUTED)

  // Stamp box
  const stampW = 90
  const stampH = 46
  const stampX = A4_WIDTH - MARGIN - stampW
  const stampY = sigY - stampH + 14
  page.drawRectangle({
    x: stampX,
    y: stampY,
    width: stampW,
    height: stampH,
    borderColor: LINE,
    borderWidth: 1,
    color: WHITE,
  })
  const stampLabel = "Official Stamp"
  drawText(
    page,
    stampLabel,
    stampX + (stampW - textWidth(fonts.regular, stampLabel, 8)) / 2,
    stampY + stampH / 2 - 3,
    8,
    fonts.regular,
    MUTED
  )

  drawText(page, `Generated by ${data.adminName}`, MARGIN, 42, 7.5, fonts.regular, MUTED)
  drawRightAlignedText(
    page,
    [data.settings.phone, data.settings.email].filter(Boolean).join("  •  "),
    A4_WIDTH - MARGIN,
    42,
    7.5,
    fonts.regular,
    MUTED
  )

  return pdfDoc.save()
}