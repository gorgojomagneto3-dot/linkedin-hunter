'use client';

import { useState, useEffect } from 'react';
import JobCard from '@/components/JobCard';
import { Job } from '@/lib/types';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('Lima, Peru');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataStatus, setDataStatus] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (query = 'empleo', loc = 'Lima, Peru', refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setStatusMessage('');
    try {
      const searchQuery = `${query} jobs in ${loc}`;
      const refreshParam = refresh ? '&refresh=true' : '';
      const response = await fetch(`/api/scrape?query=${encodeURIComponent(searchQuery)}${refreshParam}`);
      
      const data = await response.json();
      console.log('Jobs data:', data);
      
      setJobs(data.data || []);
      setDataStatus(data.status || 'unknown');
      setNeedsRefresh(data.needsRefresh || false);
      if (data.message) {
        setStatusMessage(data.message);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setStatusMessage('Error al cargar las ofertas. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(search || 'empleo', location);
  };

  const handleRefresh = () => {
    fetchJobs(search || 'empleo', location, true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🇵🇪 LinkedIn Job Hunter - Perú
          </h1>
          <p className="text-gray-600">Encuentra las mejores ofertas de trabajo en Lima en tiempo real</p>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-2">
              Última actualización: {lastUpdate.toLocaleTimeString('es-PE')}
              {dataStatus === 'direct_links' && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Enlaces directos
                </span>
              )}
              {dataStatus === 'live' && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  ✓ Datos en tiempo real
                </span>
              )}
            </p>
          )}
          {statusMessage && (
            <p className={`text-sm mt-2 px-4 py-2 rounded-lg inline-block ${needsRefresh ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'}`}>
              {needsRefresh ? '⚠️' : '✓'} {statusMessage}
            </p>
          )}
          {needsRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-3 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md font-medium disabled:opacity-50"
            >
              {refreshing ? '⏳ Buscando empleos en Perú...' : '🔄 Actualizar Datos de Perú'}
            </button>
          )}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Puesto o palabra clave (ej: desarrollador, marketing, ventas)"
              className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full md:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white"
            >
              <option value="Lima, Peru">Lima</option>
              <option value="Arequipa, Peru">Arequipa</option>
              <option value="Trujillo, Peru">Trujillo</option>
              <option value="Cusco, Peru">Cusco</option>
              <option value="Piura, Peru">Piura</option>
              <option value="Peru">Todo Perú</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium disabled:opacity-50"
            >
              🔍 Buscar
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-medium disabled:opacity-50"
            >
              {refreshing ? '⏳ Actualizando...' : '🔄 Actualizar'}
            </button>
          </div>
        </form>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {['Desarrollador', 'Marketing', 'Ventas', 'Administración', 'Contabilidad', 'Diseño', 'Ingeniero', 'Remoto'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSearch(tag);
                fetchJobs(tag, location);
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-blue-50 hover:border-blue-500 transition-colors shadow-sm"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Buscando ofertas en {location}...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No se encontraron ofertas. Intenta con otra búsqueda.</p>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-6">
              Se encontraron <span className="font-bold text-blue-600">{jobs.length}</span> ofertas de trabajo
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.job_id} job={job} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
