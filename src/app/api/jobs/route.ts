import { NextRequest, NextResponse } from 'next/server';

// Datos de demostración cuando la API está limitada
const demoJobs = [
  {
    job_id: "demo1",
    job_title: "Desarrollador Full Stack",
    employer_name: "Tech Solutions Perú",
    employer_logo: null,
    job_city: "Lima",
    job_country: "Perú",
    job_description: "Buscamos desarrollador Full Stack con experiencia en React, Node.js y bases de datos. Trabajo híbrido, excelente ambiente laboral y beneficios competitivos. Requisitos: 3+ años de experiencia, conocimiento en AWS, trabajo en equipo.",
    job_apply_link: "https://www.linkedin.com/jobs/search/?keywords=desarrollador%20full%20stack&location=Lima",
    job_posted_at_datetime_utc: new Date().toISOString(),
    job_min_salary: 5000,
    job_max_salary: 8000,
    job_salary_currency: "PEN"
  },
  {
    job_id: "demo2",
    job_title: "Analista de Marketing Digital",
    employer_name: "Digital Agency SAC",
    employer_logo: null,
    job_city: "Lima",
    job_country: "Perú",
    job_description: "Empresa líder en marketing digital busca analista con experiencia en Google Ads, Meta Ads y SEO. Ofrecemos trabajo remoto, capacitaciones constantes y plan de carrera.",
    job_apply_link: "https://www.linkedin.com/jobs/search/?keywords=marketing%20digital&location=Lima",
    job_posted_at_datetime_utc: new Date(Date.now() - 86400000).toISOString(),
    job_min_salary: 3500,
    job_max_salary: 5500,
    job_salary_currency: "PEN"
  },
  {
    job_id: "demo3",
    job_title: "Ejecutivo de Ventas B2B",
    employer_name: "Corporación Comercial",
    employer_logo: null,
    job_city: "Lima",
    job_country: "Perú",
    job_description: "Importante empresa del sector retail busca ejecutivo de ventas con cartera de clientes. Comisiones atractivas, movilidad asignada y seguro de salud. Experiencia mínima de 2 años.",
    job_apply_link: "https://www.linkedin.com/jobs/search/?keywords=ventas&location=Lima",
    job_posted_at_datetime_utc: new Date(Date.now() - 172800000).toISOString(),
    job_min_salary: 2500,
    job_max_salary: 6000,
    job_salary_currency: "PEN"
  },
  {
    job_id: "demo4",
    job_title: "Contador General",
    employer_name: "Grupo Empresarial Andino",
    employer_logo: null,
    job_city: "Lima",
    job_country: "Perú",
    job_description: "Buscamos contador titulado con experiencia en NIIF, tributación y auditoría. Manejo de ERP SAP deseable. Ofrecemos estabilidad laboral y desarrollo profesional.",
    job_apply_link: "https://www.linkedin.com/jobs/search/?keywords=contador&location=Lima",
    job_posted_at_datetime_utc: new Date(Date.now() - 259200000).toISOString(),
    job_min_salary: 4000,
    job_max_salary: 6500,
    job_salary_currency: "PEN"
  },
  {
    job_id: "demo5",
    job_title: "Diseñador UX/UI",
    employer_name: "Startup Innovadora",
    employer_logo: null,
    job_city: "Lima",
    job_country: "Perú",
    job_description: "Startup en crecimiento busca diseñador UX/UI con experiencia en Figma y metodologías ágiles. Ambiente joven, snacks gratis y horario flexible. Portfolio requerido.",
    job_apply_link: "https://www.linkedin.com/jobs/search/?keywords=diseñador%20ux&location=Lima",
    job_posted_at_datetime_utc: new Date(Date.now() - 345600000).toISOString(),
    job_min_salary: 4500,
    job_max_salary: 7000,
    job_salary_currency: "PEN"
  },
  {
    job_id: "demo6",
    job_title: "Ingeniero de Software - Remoto",
    employer_name: "Tech Company International",
    employer_logo: null,
    job_city: "Lima",
    job_country: "Perú",
    job_description: "Empresa internacional busca ingeniero de software para trabajo 100% remoto. Stack: Python, Django, PostgreSQL. Salario en dólares y horario flexible.",
    job_apply_link: "https://www.linkedin.com/jobs/search/?keywords=ingeniero%20software%20remoto&location=Peru",
    job_posted_at_datetime_utc: new Date(Date.now() - 432000000).toISOString(),
    job_min_salary: 8000,
    job_max_salary: 15000,
    job_salary_currency: "PEN"
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'empleo Lima Peru';
  
  const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
  
  if (!apiKey) {
    console.log('No API key, returning demo data');
    return NextResponse.json({ data: demoJobs, status: 'demo' });
  }

  try {
    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1&date_posted=all`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      
      // Si hay error 429 (rate limit) o cualquier otro error, devolver datos demo
      if (response.status === 429) {
        console.log('Rate limited, returning demo data');
        return NextResponse.json({ 
          data: demoJobs, 
          status: 'demo',
          message: 'API limitada. Mostrando datos de demostración. Intenta de nuevo en unos minutos.'
        });
      }
      
      return NextResponse.json({ 
        data: demoJobs,
        status: 'demo',
        error: `API Error: ${response.status}`
      });
    }

    const data = await response.json();
    
    // Si no hay resultados, devolver datos demo
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ 
        data: demoJobs, 
        status: 'demo',
        message: 'No se encontraron resultados. Mostrando datos de demostración.'
      });
    }
    
    return NextResponse.json({ ...data, status: 'live' });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ 
      data: demoJobs,
      status: 'demo',
      error: 'Error de conexión'
    });
  }
}
