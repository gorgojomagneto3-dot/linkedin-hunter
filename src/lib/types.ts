export interface Job {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string | null;
  job_city: string;
  job_country: string;
  job_description: string;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_currency?: string;
  source?: string;
}