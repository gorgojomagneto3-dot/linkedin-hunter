import { NextRequest, NextResponse } from 'next/server';

interface Job {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_city: string;
  job_country: string;
  job_description: string;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string;
  source: string;
  jobCount?: string;
  employmentType?: string;
  seniorityLevel?: string;
  applicantsCount?: string;
}

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';
const ACTOR_ID = 'hKByXkMQaC5Qt9UMN'; // LinkedIn Jobs Scraper

// Obtener trabajos del último run de Apify
async function getLatestApifyJobs(): Promise<Job[]> {
  try {
    if (!APIFY_TOKEN) {
      console.log('No APIFY_TOKEN configured');
      return [];
    }
    
    console.log('Fetching latest Apify jobs...');
    
    // Primero intentar obtener runs de MI cuenta (no del actor público)
    const myRunsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&limit=5&desc=true`
    );
    
    if (myRunsResponse.ok) {
      const myRunsData = await myRunsResponse.json();
      console.log(`Found ${myRunsData.data?.items?.length || 0} runs in my account`);
      
      // Buscar un run exitoso del actor de LinkedIn
      for (const run of myRunsData.data?.items || []) {
        if (run.status === 'SUCCEEDED' && run.actId === ACTOR_ID) {
          console.log(`Found successful run: ${run.id}`);
          const datasetId = run.defaultDatasetId;
          const itemsResponse = await fetch(
            `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=100`
          );
          
          if (itemsResponse.ok) {
            const items = await itemsResponse.json();
            console.log(`Got ${items.length} items from dataset ${datasetId}`);
            if (items.length > 0) {
              return transformApifyItems(items);
            }
          }
        }
      }
    }
    
    // Fallback: obtener del actor directamente
    const runsResponse = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}&limit=1&desc=true`
    );
    
    if (!runsResponse.ok) {
      console.log('Could not fetch actor runs:', runsResponse.status);
      return [];
    }
    
    const runsData = await runsResponse.json();
    if (!runsData.data?.items?.length) {
      console.log('No runs found for actor');
      return [];
    }
    
    const lastRun = runsData.data.items[0];
    console.log(`Last run status: ${lastRun.status}`);
    
    if (lastRun.status === 'SUCCEEDED') {
      const datasetId = lastRun.defaultDatasetId;
      const itemsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=100`
      );
      
      if (!itemsResponse.ok) {
        console.log('Could not fetch dataset items:', itemsResponse.status);
        return [];
      }
      
      const items = await itemsResponse.json();
      console.log(`Got ${items.length} items from actor dataset`);
      return transformApifyItems(items);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting latest Apify jobs:', error);
    return [];
  }
}

// Ejecutar nuevo scraping en Apify
async function runApifyScraper(query: string, location: string): Promise<Job[]> {
  try {
    if (!APIFY_TOKEN) {
      console.log('No APIFY_TOKEN configured');
      return [];
    }
    
    console.log(`Starting Apify scraper for: "${query}" in "${location}"`);
    
    // URL de búsqueda con sortBy=DD para ordenar por más reciente
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&sortBy=DD&position=1&pageNum=0`;
    
    // Iniciar el actor con el formato correcto (urls como array)
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: [searchUrl],
          maxResults: 50,
          scrapeJobDetails: false
        })
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Error starting Apify:', runResponse.status, errorText);
      return [];
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('Apify run started:', runId);

    // Esperar a que termine (máximo 120 segundos)
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 60;

    while ((status === 'RUNNING' || status === 'READY') && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
      );
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`Apify status: ${status} (attempt ${attempts})`);
      }
    }

    if (status !== 'SUCCEEDED') {
      console.error('Apify run did not succeed:', status);
      return [];
    }

    // Obtener los resultados
    const datasetResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`
    );
    const items = await datasetResponse.json();

    console.log(`Apify returned ${items.length} jobs`);
    return transformApifyItems(items);

  } catch (error) {
    console.error('Error with Apify:', error);
    return [];
  }
}

// Transformar items de Apify al formato de nuestra app
function transformApifyItems(items: any[]): Job[] {
  const jobs = items.map((item: any, index: number) => ({
    job_id: item.id || `linkedin_${Date.now()}_${index}`,
    job_title: item.title || 'Sin título',
    employer_name: item.companyName || 'Empresa',
    employer_logo: item.companyLogo || null,
    job_city: item.location || 'No especificada',
    job_country: item.companyAddress?.addressCountry || '',
    job_description: item.descriptionText?.substring(0, 500) || 'Ver detalles en LinkedIn',
    job_apply_link: item.link || item.applyUrl || 'https://www.linkedin.com/jobs',
    job_posted_at_datetime_utc: parsePostedDate(item.postedAt),
    job_min_salary: extractSalaryMin(item.salary),
    job_max_salary: extractSalaryMax(item.salary),
    job_salary_currency: 'USD',
    source: 'LinkedIn',
    employmentType: item.employmentType || '',
    seniorityLevel: item.seniorityLevel || '',
    applicantsCount: item.applicantsCount || ''
  }));
  
  // Ordenar por fecha más reciente primero
  return jobs.sort((a, b) => {
    const dateA = new Date(a.job_posted_at_datetime_utc).getTime();
    const dateB = new Date(b.job_posted_at_datetime_utc).getTime();
    return dateB - dateA; // Más reciente primero
  });
}

// Parsear fecha de publicación (puede venir como "hace 2 horas", "ayer", etc.)
function parsePostedDate(postedAt: string | null): string {
  if (!postedAt) return new Date().toISOString();
  
  const now = new Date();
  const lowerPosted = postedAt.toLowerCase();
  
  // Si ya es una fecha ISO, devolverla
  if (postedAt.includes('T') || postedAt.match(/^\d{4}-\d{2}-\d{2}/)) {
    return postedAt;
  }
  
  // Parsear formatos relativos en español e inglés
  if (lowerPosted.includes('hora') || lowerPosted.includes('hour')) {
    const hours = parseInt(postedAt) || 1;
    now.setHours(now.getHours() - hours);
  } else if (lowerPosted.includes('minuto') || lowerPosted.includes('minute')) {
    const minutes = parseInt(postedAt) || 30;
    now.setMinutes(now.getMinutes() - minutes);
  } else if (lowerPosted.includes('día') || lowerPosted.includes('day') || lowerPosted.includes('ayer') || lowerPosted.includes('yesterday')) {
    const days = parseInt(postedAt) || 1;
    now.setDate(now.getDate() - days);
  } else if (lowerPosted.includes('semana') || lowerPosted.includes('week')) {
    const weeks = parseInt(postedAt) || 1;
    now.setDate(now.getDate() - (weeks * 7));
  } else if (lowerPosted.includes('mes') || lowerPosted.includes('month')) {
    const months = parseInt(postedAt) || 1;
    now.setMonth(now.getMonth() - months);
  }
  
  return now.toISOString();
}

function extractSalaryMin(salary: string | null): number | null {
  if (!salary) return null;
  const match = salary.match(/\$?([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return null;
}

function extractSalaryMax(salary: string | null): number | null {
  if (!salary) return null;
  const matches = salary.match(/\$?([\d,]+)/g);
  if (matches && matches.length >= 2) {
    return parseInt(matches[1].replace(/[,$]/g, ''));
  }
  return null;
}

// Fallback: Generar enlace directo a LinkedIn
function generateLinkedInFallback(query: string, location: string): Job[] {
  const searchQuery = encodeURIComponent(query);
  const locationClean = location.replace(', Peru', '').replace(', Perú', '');

  return [{
    job_id: `linkedin_fallback_${Date.now()}`,
    job_title: `🔍 Buscar "${query}" en LinkedIn`,
    employer_name: 'LinkedIn Jobs',
    employer_logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/240px-LinkedIn_logo_initials.png',
    job_city: locationClean,
    job_country: 'Perú',
    job_description: `Haz clic para ver todas las ofertas de "${query}" en LinkedIn Jobs.`,
    job_apply_link: `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}&location=${encodeURIComponent(location)}&f_TPR=r86400`,
    job_posted_at_datetime_utc: new Date().toISOString(),
    job_min_salary: null,
    job_max_salary: null,
    job_salary_currency: 'PEN',
    source: 'LinkedIn'
  }];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fullQuery = searchParams.get('query') || 'empleo Lima Peru';
  const forceRefresh = searchParams.get('refresh') === 'true';
  
  const queryParts = fullQuery.replace(' jobs in ', '|').split('|');
  const query = queryParts[0] || 'empleo';
  const location = queryParts[1] || 'Lima, Peru';

  console.log(`LinkedIn Jobs request: "${query}" in "${location}" (refresh: ${forceRefresh})`);

  let jobs: Job[] = [];

  // Si se pide refresh, ejecutar nuevo scraping
  if (forceRefresh) {
    jobs = await runApifyScraper(query, location);
  } else {
    // Primero intentar con los datos más recientes
    jobs = await getLatestApifyJobs();
  }

  // Si no hay resultados, usar fallback
  if (jobs.length === 0) {
    jobs = generateLinkedInFallback(query, location);
    return NextResponse.json({
      data: jobs,
      status: 'fallback',
      message: `Haz clic para buscar "${query}" directamente en LinkedIn.`,
      sources: ['LinkedIn']
    });
  }

  // Filtrar por ubicación (Peru/Lima) si es necesario
  const locationLower = location.toLowerCase();
  const isPeruSearch = locationLower.includes('peru') || locationLower.includes('lima');
  
  let locationFilteredJobs = jobs;
  if (isPeruSearch) {
    locationFilteredJobs = jobs.filter(job => {
      const jobLocation = `${job.job_city} ${job.job_country}`.toLowerCase();
      return jobLocation.includes('peru') || 
             jobLocation.includes('perú') || 
             jobLocation.includes('lima') ||
             jobLocation.includes('arequipa') ||
             jobLocation.includes('trujillo') ||
             jobLocation.includes('remote') ||
             jobLocation.includes('remoto');
    });
  }
  
  // Si no hay empleos en Perú, mostrar todos pero indicarlo
  if (locationFilteredJobs.length === 0 && isPeruSearch) {
    console.log('No jobs found for Peru, showing all available jobs');
    // Mostrar los trabajos disponibles pero indicar que no son de Perú
    return NextResponse.json({
      data: jobs.slice(0, 30),
      status: 'live',
      message: `⚠️ No se encontraron empleos en Perú. Mostrando ${jobs.length} ofertas internacionales. Usa el botón "Actualizar Datos" para buscar empleos específicos de Perú.`,
      sources: ['LinkedIn'],
      total: jobs.length,
      needsRefresh: true
    });
  }

  // Filtrar por query si tenemos datos
  const filteredJobs = locationFilteredJobs.filter(job => {
    const searchTerms = query.toLowerCase().split(' ');
    const jobText = `${job.job_title} ${job.employer_name} ${job.job_description}`.toLowerCase();
    return searchTerms.some(term => jobText.includes(term));
  });

  const finalJobs = filteredJobs.length > 0 ? filteredJobs : locationFilteredJobs;

  return NextResponse.json({
    data: finalJobs.slice(0, 30),
    status: 'live',
    message: `🔥 ${finalJobs.length} ofertas de LinkedIn en ${location}`,
    sources: ['LinkedIn'],
    total: jobs.length
  });
}
