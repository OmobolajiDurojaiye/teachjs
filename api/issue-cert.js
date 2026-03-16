export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipient_name, recipient_email, issue_date } = req.body;

  if (!recipient_name || !recipient_email || !issue_date) {
    return res.status(400).json({ error: 'Missing required fields: recipient_name, recipient_email, issue_date' });
  }

  const apiKey = process.env.PROOFDECK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://certifyme.pythonanywhere.com/api/v1/certificates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        template_id: 70,
        recipient_name,
        recipient_email,
        course_title: 'JavaScript Fundamentals',
        issue_date
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.detail || data.message || 'ProofDeck API error' });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reach ProofDeck API: ' + err.message });
  }
}
