// api/index.js
// Hardcoded valid keys as requested: abhay1, abhay2, abhay3, abhay4, abhay5
const VALID_KEYS = ['abhay1', 'abhay2', 'abhay3', 'abhay4', 'abhay5'];

const FOOTER = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 BUY API : @Cyb3rS0ldier
🆘 SUPPORT : @Cyb3rS0ldier
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

export default async function handler(req, res) {
  // Enable CORS for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract query parameters: api_key and number (instead of exploits)
  const { api_key, number } = req.query;

  // --- Multi-Key Authentication (abhay1 to abhay5) ---
  if (!api_key) {
    return res.status(401).json({ 
      error: 'Missing API key', 
      usage: '?api_key=abhay1&number=9876543210',
      valid_keys: VALID_KEYS
    });
  }

  if (!VALID_KEYS.includes(api_key)) {
    return res.status(403).json({ 
      error: 'Invalid API key', 
      valid_keys: VALID_KEYS 
    });
  }

  // --- Validate number parameter (10 digits) ---
  if (!number) {
    return res.status(400).json({ 
      error: 'Missing number parameter', 
      usage: '?api_key=abhay1&number=9876543210' 
    });
  }

  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(number)) {
    return res.status(400).json({ 
      error: 'Invalid number. Must be exactly 10 digits.' 
    });
  }

  // Target API endpoint (uses 'exploits' parameter, but we map 'number' to it)
  const targetUrl = `https://exploitsindia.site/api/number.php?exploits=${number}`;

  try {
    // Fetch data from target
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VercelBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Referer': 'https://exploitsindia.site/'
      }
    });

    let content = await response.text();

    // --- Remove any "developer by abhay singh" (case-insensitive, with possible typos) ---
    const removePatterns = [
      /developer\s+by\s+abhay\s+singh/gi,
      /developed\s+by\s+abhay\s+singh/gi,
      /credit:\s*abhay\s+singh/gi,
      /abhay\s+singh\s*\|/gi
    ];
    for (const pattern of removePatterns) {
      content = content.replace(pattern, '');
    }
    // Also remove isolated lines that might contain "abhay singh"
    content = content.replace(/^.*abhay singh.*$/gim, '');

    // Clean up multiple newlines left after removal
    content = content.replace(/\n\s*\n/g, '\n\n');

    // --- Append required footer ---
    content = content + FOOTER;

    // Send response with same status code as target
    res.status(response.status).send(content);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from target', 
      details: error.message,
      suggestion: 'Check if exploitsindia.site is reachable'
    });
  }
}
