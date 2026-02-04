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
}

// Generar búsqueda en tiempo real solo para LinkedIn
function generateLinkedInSearch(query: string, location: string): Job[] {
  const searchQuery = encodeURIComponent(query);
  const locationClean = location.replace(', Peru', '').replace(', Perú', '');
  const now = new Date();

  return [
    {
      job_id: `linkedin_${Date.now()}_1`,
      job_title: `${query} - Empleos en LinkedIn`,
      employer_name: 'LinkedIn Jobs',
      employer_logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/240px-LinkedIn_logo_initials.png',
      job_city: locationClean,
      job_country: 'Perú',
      job_description: `🔥 Ver todas las ofertas de "${query}" en LinkedIn Jobs. Filtra por ubicación, tipo de empleo, nivel de experiencia y más.`,
      job_apply_link: `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}&location=${encodeURIComponent(location)}&f_TPR=r86400&position=1&pageNum=0`,
      job_posted_at_datetime_utc: now.toISOString(),
      job_min_salary: null,
      job_max_salary: null,
      job_salary_currency: 'PEN',
      source: 'LinkedIn',
      jobCount: 'Ofertas en tiempo real'
    }
  ];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fullQuery = searchParams.get('query') || 'empleo Lima Peru';
  
  // Extraer query y location del parámetro
  const queryParts = fullQuery.replace(' jobs in ', '|').split('|');
  const query = queryParts[0] || 'empleo';
  const location = queryParts[1] || 'Lima, Peru';

  console.log(`Generating LinkedIn search for: "${query}" in "${location}"`);

  const jobs = generateLinkedInSearch(query, location);

  return NextResponse.json({
    data: jobs,
    status: 'live',
    message: `🔥 Búsqueda en LinkedIn en tiempo real para "${query}"`,
    sources: ['LinkedIn']
  });
}
