// api/index.js
// Multi-key: team6months, abhay2, abhay3, abhay4, abhay5
const VALID_KEYS = ['team6months', 'abhay2', 'abhay3', 'abhay4', 'abhay5'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { api_key, number } = req.query;

  // --- Authentication ---
  if (!api_key) {
    return res.status(401).json({ 
      error: 'Missing API key',
      valid_keys: VALID_KEYS,
      developer: 'abhay singh'
    });
  }
  if (!VALID_KEYS.includes(api_key)) {
    return res.status(403).json({ 
      error: 'Invalid API key',
      developer: 'abhay singh'
    });
  }

  // --- Validate number ---
  if (!number) {
    return res.status(400).json({ 
      error: 'Missing number parameter',
      usage: '?api_key=team6months&number=9876543210',
      developer: 'abhay singh'
    });
  }
  if (!/^\d{10}$/.test(number)) {
    return res.status(400).json({ 
      error: 'Invalid number. 10 digits required.',
      developer: 'abhay singh'
    });
  }

  const targetUrl = `https://believes-shore-funny-void.trycloudflare.com/search?q=${number}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VercelBot/1.0)',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Check if target returned error or no data
    const hasError = !data.status || data.count === 0 || !data.results || data.results.length === 0;
    
    // Prepare result in desired format
    const result = {
      status: hasError ? "no_results" : "success",
      developer: "abhay singh",
      queried_number: number,
      timestamp: new Date().toISOString(),
      results: []
    };

    if (!hasError && data.results && data.results.length > 0) {
      // Use a Map to track unique entries (by id or by name+fname+address)
      const uniqueMap = new Map();
      
      for (const item of data.results) {
        // Create a unique key - prioritize id if available, otherwise combine fields
        let uniqueKey;
        if (item.id && item.id !== 'xxxx-xxxx-5107' && item.id !== 'null') {
          uniqueKey = item.id;
        } else {
          uniqueKey = `${item.name || ''}|${item.fname || ''}|${item.address || ''}`;
        }
        
        // Only add if not already in map
        if (!uniqueMap.has(uniqueKey)) {
          // Transform each result to match desired format
          const transformedPerson = {};
          
          if (item.name && item.name.trim()) {
            transformedPerson.name = item.name.trim();
          }
          if (item.fname && item.fname.trim()) {
            transformedPerson.father_name = item.fname.trim();
          }
          if (item.mobile) {
            transformedPerson.mobile = item.mobile;
          }
          if (item.address && item.address.trim()) {
            transformedPerson.address = item.address.trim();
          }
          if (item.circle) {
            transformedPerson.circle = item.circle;
          }
          if (item.alt && item.alt !== 'null') {
            transformedPerson.alternate_number = item.alt;
          }
          if (item.id && item.id !== 'xxxx-xxxx-5107' && item.id !== 'null') {
            transformedPerson.aadhaar = item.id;
          }
          if (item.email && item.email !== 'null') {
            transformedPerson.email = item.email;
          }
          
          uniqueMap.set(uniqueKey, transformedPerson);
        }
      }
      
      // Convert map values to array
      result.results = Array.from(uniqueMap.values());
      result.count = result.results.length;
    }

    // If no results, add message
    if (result.results.length === 0) {
      result.status = "no_results";
      result.message = "No data found for this number";
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      status: "error",
      developer: "abhay singh",
      error: "Failed to fetch from target",
      details: error.message
    });
  }
}
