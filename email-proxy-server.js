const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const RESEND_API_KEY = 're_cfLQWv8y_2CaKP26okdNq2pdHtQKGmFF4';

app.post('/api/send-email', async (req, res) => {
  try {
    console.log('📧 Proxying email request to Resend...');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Email sent successfully:', data.id);
      res.json(data);
    } else {
      console.error('❌ Resend API error:', data);
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Email proxy server running' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Email Proxy Server running on http://localhost:${PORT}`);
  console.log(`📧 Ready to proxy emails to Resend API\n`);
});
