import { Job } from '@/lib/types';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-PE');
  };
  
  const isRecent = () => {
    const date = new Date(job.job_posted_at_datetime_utc);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  const formatSalary = (min: number | null | undefined, max: number | null | undefined) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `Desde $${min.toLocaleString()}`;
    return `Hasta $${max?.toLocaleString()}`;
  };

  const salary = formatSalary(job.job_min_salary, job.job_max_salary);

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border flex flex-col h-full ${isRecent() ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-100'}`}>
      {/* Badge de reciente */}
      {isRecent() && (
        <div className="mb-2">
          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium animate-pulse">
            🆕 NUEVO
          </span>
        </div>
      )}
      
      {/* Header con logo y título */}
      <div className="flex items-start gap-3 mb-4">
        {job.employer_logo ? (
          <img 
            src={job.employer_logo} 
            alt={job.employer_name} 
            className="w-12 h-12 rounded-lg object-contain bg-gray-50 p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">
              {job.employer_name?.charAt(0) || 'L'}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-blue-600">
            {job.job_title}
          </h3>
          <p className="text-blue-600 font-medium truncate">{job.employer_name}</p>
        </div>
      </div>

      {/* Ubicación */}
      <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
        <span>📍</span> {job.job_city || 'Ubicación no especificada'}
        {job.job_country && job.job_country !== 'Perú' && `, ${job.job_country}`}
      </p>

      {/* Tags de empleo */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(job as any).employmentType && (
          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
            {(job as any).employmentType}
          </span>
        )}
        {(job as any).seniorityLevel && (job as any).seniorityLevel !== 'Not Applicable' && (
          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
            {(job as any).seniorityLevel}
          </span>
        )}
        {(job as any).applicantsCount && (
          <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
            👥 {(job as any).applicantsCount} aplicantes
          </span>
        )}
      </div>

      {/* Descripción */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
        {job.job_description?.substring(0, 200)}...
      </p>
      
      {/* Salario */}
      {salary && (
        <p className="text-green-600 font-semibold mb-3 flex items-center gap-1">
          <span>💰</span> {salary} {job.job_salary_currency || ''}
        </p>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <span>🕐</span> {formatDate(job.job_posted_at_datetime_utc)}
          </span>
          {job.source && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
              {job.source}
            </span>
          )}
        </div>
        <a
          href={job.job_apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
        >
          Ver Oferta →
        </a>
      </div>
    </div>
  );
}