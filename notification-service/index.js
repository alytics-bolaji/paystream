/**
 * PayStream Notification Service
 * Receives payment events and stores notifications for the frontend.
 */
const express  = require('express')
const promClient = require('prom-client')


const app = express()
app.use(express.json())


// ── Prometheus setup ──────────────────────────────────────────────────
const register = new promClient.Registry()
promClient.collectDefaultMetrics({ register })


const notifCounter = new promClient.Counter({
  name: 'paystream_notifications_total',
  help: 'Total notifications created',
  labelNames: ['type'],
  registers: [register]
})


// ── In-memory store ───────────────────────────────────────────────────
const notifications = []


// ── Routes ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service', version: '1.0.0' })
})


app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})


app.post('/api/v1/notifications', (req, res) => {
  const { payment_id, recipient, amount, currency } = req.body
  if (!payment_id || !recipient || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' })
  }


  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: currency || 'NGN', minimumFractionDigits: 2
  }).format(amount)


  const notification = {
    id: Date.now().toString(),
    payment_id,
    message: `Payment of ${formattedAmount} sent to ${recipient} — completed successfully`,
    read: false,
    created_at: new Date().toISOString()
  }


  notifications.push(notification)
  notifCounter.labels({ type: 'payment_completed' }).inc()
  res.status(201).json(notification)
})


app.get('/api/v1/notifications', (req, res) => {
  res.json(notifications)
})


const PORT = process.env.PORT || 3005
app.listen(PORT, () => {
  console.log(`Notification service listening on port ${PORT}`)
})
