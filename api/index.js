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

  const targetUrl = `https://exploitsindia.site/api/number.php?exploits=${number}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VercelBot/1.0)',
        'Accept': 'text/html,text/plain'
      }
    });

    let rawText = await response.text();
    
    // Check if target returned error or no data
    const hasError = rawText.includes('❌ Missing number') || 
                     rawText.includes('error') ||
                     rawText.length < 50;
    
    // --- Parse the scraped text into JSON structure ---
    const result = {
      status: hasError ? "no_results" : "success",
      developer: "abhay singh",
      queried_number: number,
      timestamp: new Date().toISOString(),
      results: []
    };

    if (!hasError) {
      // Parse blocks only if no error
      const blocks = rawText.split(/📌 Additional Result:/i);
      
      // First block (main result)
      const mainBlock = blocks[0];
      const mainPerson = parsePersonBlock(mainBlock);
      if (mainPerson) result.results.push(mainPerson);
      
      // Additional blocks
      for (let i = 1; i < blocks.length; i++) {
        const person = parsePersonBlock(blocks[i]);
        if (person) result.results.push(person);
      }
    }

    // If parsing failed or no results, attach raw response only (NO FOOTER)
    if (result.results.length === 0) {
      result.status = "no_results";
      result.warning = "Could not parse structured data or no data found for this number";
      result.raw = rawText;
      // ❌ NO FOOTER - removed completely
    }

    // Developer credit always present (NO FOOTER)
    result.developer = "abhay singh";

    return res.status(200).json(result);

  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      status: "error",
      developer: "abhay singh",
      error: "Failed to fetch from target",
      details: error.message
      // ❌ NO FOOTER - removed completely
    });
  }
}

// Helper function to parse a person block from text
function parsePersonBlock(blockText) {
  try {
    const person = {};
    
    // Extract Name
    const nameMatch = blockText.match(/👤\s*Name:\s*(.+?)(?:\n|$)/i);
    if (nameMatch) person.name = nameMatch[1].trim();
    
    // Extract Father Name
    const fatherMatch = blockText.match(/👨‍👦\s*Father\s*Name:\s*(.+?)(?:\n|$)/i);
    if (fatherMatch) person.father_name = fatherMatch[1].trim();
    
    // Extract Mobile
    const mobileMatch = blockText.match(/📱\s*Mobile:\s*(\d+)/i);
    if (mobileMatch) person.mobile = mobileMatch[1];
    
    // Extract Address
    const addressMatch = blockText.match(/🏠\s*Address:\s*(.+?)(?:\n|$)/i);
    if (addressMatch) person.address = addressMatch[1].trim();
    
    // Extract Circle
    const circleMatch = blockText.match(/📡\s*Circle:\s*(.+?)(?:\n|$)/i);
    if (circleMatch) person.circle = circleMatch[1].trim();
    
    // Extract Alternate number
    const altMatch = blockText.match(/📞\s*Alternate:\s*(\d+)/i);
    if (altMatch) person.alternate_number = altMatch[1];
    
    // Extract Aadhaar
    const aadhaarMatch = blockText.match(/🪪\s*Aadhaar:\s*(\d+)/i);
    if (aadhaarMatch) person.aadhaar = aadhaarMatch[1];
    
    // If at least name or mobile exists, return person
    if (person.name || person.mobile) {
      return person;
    }
    return null;
  } catch (e) {
    return null;
  }
}
