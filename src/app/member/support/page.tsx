"use client"
import { useState, useEffect } from "react"
import { LifeBuoy, Phone, Mail, MapPin, Clock, MessageCircle, ChevronDown, ChevronUp, Send, CheckCircle, AlertCircle, HelpCircle, Plus } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils"

interface FAQ {
  id: string
  question: string
  answer: string
}

interface SupportTicket {
  id: string
  subject: string
  message: string
  status: string
  adminReply: string | null
  createdAt: string
  updatedAt: string
}

function FAQSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-surface-2" />
      ))}
    </div>
  )
}

function TicketSkeleton() {
  return (
    <div className="rounded-xl border border-hairline bg-surface-1 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-48 bg-surface-2 rounded" />
        <div className="h-5 w-16 bg-surface-2 rounded-full" />
      </div>
      <div className="h-4 w-full bg-surface-2 rounded mb-2" />
      <div className="h-4 w-3/4 bg-surface-2 rounded" />
      <div className="mt-3 h-3 w-32 bg-surface-2 rounded" />
    </div>
  )
}

export default function MemberSupport() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingFaqs, setLoadingFaqs] = useState(true)
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)

  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchFaqs(), fetchTickets()])
  }, [])

  async function fetchFaqs() {
    setLoadingFaqs(true)
    try {
      const res = await fetch("/api/member/support?faqs=true")
      if (!res.ok) throw new Error("Failed to load FAQs")
      const data = await res.json()
      setFaqs(data.faqs || [])
    } catch {
      // silent
    } finally {
      setLoadingFaqs(false)
    }
  }

  async function fetchTickets() {
    setLoadingTickets(true)
    setError(null)
    try {
      const res = await fetch("/api/member/support")
      if (!res.ok) throw new Error("Failed to load tickets")
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoadingTickets(false)
    }
  }

  async function handleSubmitTicket() {
    if (!subject.trim() || !message.trim()) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch("/api/member/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to submit ticket")
      }
      const data = await res.json()
      setTickets((prev) => [data.ticket, ...prev])
      setSubject("")
      setMessage("")
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit ticket")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Help & Support</h1>
          <p className="mt-1 text-sm text-ink-muted">We're here to help you every step of the way</p>
        </div>
<div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3">
          <LifeBuoy className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Gym Contact Info */}
      <div className="rounded-xl border-l-4 border-indigo-500 bg-surface-1 p-6 dark:border-indigo-400">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-lg bg-indigo-500/10 p-2 dark:bg-indigo-400/10">
            <LifeBuoy className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-ink">Contact Us</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
            <div className="rounded-full bg-emerald-500/10 p-2 dark:bg-emerald-400/10">
              <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Phone</p>
              <a href="tel:+919999999999" className="text-sm font-medium text-ink hover:text-primary transition-colors">
                +91 99999 99999
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
            <div className="rounded-full bg-blue-500/10 p-2 dark:bg-blue-400/10">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Email</p>
              <a href="mailto:support@gymflow.com" className="text-sm font-medium text-ink hover:text-primary transition-colors">
                support@gymflow.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
            <div className="rounded-full bg-purple-500/10 p-2 dark:bg-purple-400/10">
              <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Address</p>
              <p className="text-sm font-medium text-ink">123 Fitness St, Gym City</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3">
            <div className="rounded-full bg-amber-500/10 p-2 dark:bg-amber-400/10">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Hours</p>
              <p className="text-sm font-medium text-ink">Mon-Sat: 6AM - 10PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-ink">Frequently Asked Questions</h2>
          </div>
        </CardHeader>
        <CardContent>
          {loadingFaqs ? (
            <FAQSkeleton />
          ) : faqs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <HelpCircle className="h-10 w-10 text-ink-tertiary mb-3" />
              <p className="text-sm text-ink-muted">No FAQs available right now. Check back later!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => {
                const isOpen = openFaq === faq.id
                return (
                  <div
                    key={faq.id}
                    className="rounded-xl border border-hairline overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left bg-surface-1 hover:bg-surface-2 transition-colors"
                    >
                      <span className="text-sm font-medium text-ink pr-4">
                        {faq.question}
                      </span>
                      <div className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                        <ChevronDown className="h-5 w-5 text-ink-tertiary" />
                      </div>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-5 pb-4 pt-0 bg-surface-1">
                        <p className="text-sm text-ink-muted leading-relaxed border-t border-hairline pt-3">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Ticket */}
      <Card className="border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-ink">Still need help?</h2>
          </div>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-950/30">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">Ticket Submitted!</h3>
              <p className="mt-1 text-sm text-ink-muted max-w-md">
                We've received your request. Our team will get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                id="subject"
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
              />
              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-sm font-medium text-ink-muted">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="block w-full rounded-lg border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink placeholder-ink-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              {submitError && (
                <div className="flex items-center gap-2 rounded-lg bg-semantic-error/10 border-semantic-error/20 p-3 text-sm text-semantic-error">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitTicket}
                  loading={submitting}
                  disabled={!subject.trim() || !message.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-ink">My Tickets</h2>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTickets ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <TicketSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="rounded-full bg-semantic-error/10 border-semantic-error/20 p-4">
                <AlertCircle className="h-8 w-8 text-semantic-error" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-ink">Failed to load tickets</h3>
              <p className="mt-1 text-sm text-ink-muted">{error}</p>
              <Button onClick={fetchTickets} variant="secondary" className="mt-3">Try Again</Button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="rounded-full bg-surface-2 p-5">
                <MessageCircle className="h-10 w-10 text-ink-tertiary" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-ink">No support tickets yet</h3>
              <p className="mt-1 text-sm text-ink-muted max-w-sm">
                Submit your first ticket above and track its status here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const isExpanded = expandedTicket === ticket.id
                return (
                  <div
                    key={ticket.id}
                    className="rounded-xl border border-hairline bg-surface-1 overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                      className="w-full text-left"
                    >
                      <div className="px-5 py-4 hover:bg-surface-2 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">
                              {ticket.subject}
                            </p>
                            <p className="mt-1 text-sm text-ink-muted line-clamp-2">
                              {ticket.message}
                            </p>
                            <p className="mt-1.5 text-xs text-ink-tertiary">
                              {formatDateTime(ticket.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge status={ticket.status === "OPEN" ? "PENDING" : "PAID"}>
                              {ticket.status === "OPEN" ? "Open" : "Closed"}
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-ink-tertiary" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-ink-tertiary" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Conversation */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-5 pb-4 border-t border-hairline">
                        {/* Original Message */}
                        <div className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full bg-indigo-500/10 p-2 dark:bg-indigo-400/10 shrink-0">
                              <MessageCircle className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-medium text-ink">You</p>
                                <span className="text-[10px] text-ink-tertiary">{formatDateTime(ticket.createdAt)}</span>
                              </div>
                              <p className="text-sm text-ink-muted">{ticket.message}</p>
                            </div>
                          </div>
                        </div>

                        {/* Admin Reply */}
                        {ticket.adminReply && (
                          <div className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-emerald-500/10 p-2 dark:bg-emerald-400/10 shrink-0">
                                <LifeBuoy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-xs font-medium text-ink">GymFlow Support</p>
                                  <span className="text-[10px] text-ink-tertiary">{formatDateTime(ticket.updatedAt)}</span>
                                </div>
                                <p className="text-sm text-ink-muted">{ticket.adminReply}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
