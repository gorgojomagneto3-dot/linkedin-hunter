import { NextRequest, NextResponse } from 'next/server';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';
const ACTOR_ID = 'hKByXkMQaC5Qt9UMN';

// Ciudades peruanas para hacer scraping
const PERU_LOCATIONS = [
  'Lima, Peru',
  'Arequipa, Peru', 
  'Trujillo, Peru'
];

// Palabras clave para buscar
const SEARCH_KEYWORDS = [
  'empleo',
  'trabajo',
  'developer',
  'ingeniero',
  'marketing',
  'ventas',
  'administrador'
];

async function runApifyScraping(keyword: string, location: string): Promise<string | null> {
  try {
    console.log(`[CRON] Starting scraping: "${keyword}" in "${location}"`);
    
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&sortBy=DD&position=1&pageNum=0`;
    
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: [searchUrl],
          maxResults: 100,
          scrapeJobDetails: false
        })
      }
    );

    if (!runResponse.ok) {
      console.error(`[CRON] Error starting Apify: ${runResponse.status}`);
      return null;
    }

    const runData = await runResponse.json();
    console.log(`[CRON] Scraping started with run ID: ${runData.data.id}`);
    return runData.data.id;
  } catch (error) {
    console.error('[CRON] Error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Verificar autorización (para Vercel Cron)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // En desarrollo, permitir sin auth. En producción, verificar el secret
  if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!APIFY_TOKEN) {
    return NextResponse.json({ error: 'APIFY_API_TOKEN not configured' }, { status: 500 });
  }

  console.log('[CRON] Starting scheduled LinkedIn jobs scraping...');
  console.log(`[CRON] Time: ${new Date().toISOString()}`);

  const runIds: string[] = [];

  // Hacer scraping para cada combinación de keyword y ubicación
  // Priorizar Lima con varias keywords
  for (const keyword of SEARCH_KEYWORDS.slice(0, 3)) { // Solo las 3 primeras keywords para no exceder límites
    const runId = await runApifyScraping(keyword, 'Lima, Peru');
    if (runId) runIds.push(runId);
    
    // Esperar un poco entre requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // También hacer una búsqueda general para otras ciudades
  for (const location of PERU_LOCATIONS.slice(1)) { // Arequipa y Trujillo
    const runId = await runApifyScraping('empleo', location);
    if (runId) runIds.push(runId);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return NextResponse.json({
    success: true,
    message: `Started ${runIds.length} scraping jobs`,
    runIds,
    timestamp: new Date().toISOString(),
    nextRun: 'In 6 hours'
  });
}

// También permitir POST para triggers manuales
export async function POST(request: NextRequest) {
  return GET(request);
}
