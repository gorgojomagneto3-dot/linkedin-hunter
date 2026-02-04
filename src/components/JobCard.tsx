import { Job } from '@/lib/types';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-PE');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600">
            {job.job_title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            {job.employer_logo && (
              <img 
                src={job.employer_logo} 
                alt={job.employer_name} 
                className="w-8 h-8 rounded object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <p className="text-blue-600 font-medium">{job.employer_name}</p>
          </div>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            <span>📍</span> {job.job_city || 'Ubicación no especificada'}{job.job_country ? `, ${job.job_country}` : ''}
          </p>
          {job.source && (
            <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
              {job.source}
            </span>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
        {job.job_description?.substring(0, 200)}...
      </p>
      
      {(job.job_min_salary || job.job_max_salary) && (
        <p className="text-green-600 font-semibold mb-3 flex items-center gap-1">
          <span>💰</span>
          {job.job_min_salary && job.job_max_salary 
            ? `S/. ${job.job_min_salary.toLocaleString()} - ${job.job_max_salary.toLocaleString()}`
            : job.job_min_salary 
              ? `Desde S/. ${job.job_min_salary.toLocaleString()}`
              : `Hasta S/. ${job.job_max_salary?.toLocaleString()}`
          }
          {job.job_salary_currency && job.job_salary_currency !== 'PEN' && ` ${job.job_salary_currency}`}
        </p>
      )}
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <span>🕐</span> {formatDate(job.job_posted_at_datetime_utc)}
        </span>
        <a
          href={job.job_apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
        >
          Ver Oferta
          <span>→</span>
        </a>
      </div>
    </div>
  );
}