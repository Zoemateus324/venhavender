import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FeaturedAds from '../components/FeaturedAds';
import AdGrid from '../components/AdGrid';
import FooterAds from '../components/FooterAds';
import SpecialAdsCarousel from '../components/SpecialAdsCarousel';
import { TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [visitorsCount, setVisitorsCount] = useState<number>(0);
  const [selectedAdType, setSelectedAdType] = useState<'sale' | 'rent' | ''>('');

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 30);

        // Tenta RPC de contagem no servidor
        const { data: rpcCount, error: rpcError } = await supabase
          .rpc('count_unique_visitors', {
            p_start: start.toISOString(),
            p_end: now.toISOString(),
          });

        if (!rpcError && typeof rpcCount === 'number') {
          setVisitorsCount(rpcCount);
          return;
        }

        // Fallback local por device_id
        const { data, error } = await supabase
          .from('page_views')
          .select('device_id')
          .gte('created_at', start.toISOString())
          .lt('created_at', now.toISOString());
        if (error) throw error;
        const unique = new Set((data || []).map((r: any) => r.device_id));
        setVisitorsCount(unique.size);
      } catch (_) {
        setVisitorsCount(0);
      }
    };

    fetchVisitors();
  }, []);
  

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/ads?q=${encodeURIComponent(q)}` : '/ads');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <section className="mb-12">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 rounded-2xl p-6 sm:p-8 md:p-10 text-white shadow-lg">
          {/* Decorative blurred shapes */}
          <div className="pointer-events-none absolute -top-10 -left-10 w-72 h-72 bg-white/10 blur-3xl rounded-full" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 w-80 h-80 bg-yellow-300/20 blur-3xl rounded-full" />

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-3 text-center">
            Encontre tudo o que<br/>
            <span className="text-yellow-300">você precisa</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 mb-6 sm:mb-8 text-center">A maior plataforma de classificados do Brasil.</p>
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto px-2">
            <div className="bg-white rounded-full p-1.5 sm:p-2 flex items-center gap-2 shadow mx-auto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="O que você está procurando? Ex: iPhone, apartamento, carro..."
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full text-gray-700 focus:outline-none text-sm sm:text-base"
              />
              <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base">Buscar</button>
            </div>
          </form>
          <div className="mt-4 sm:mt-6 text-center px-2">
            <Link to="/dashboard/ads/create" className="inline-block bg-yellow-400 text-gray-900 font-semibold px-5 sm:px-6 py-2 rounded-full hover:bg-yellow-300">Anunciar Grátis</Link>
            <span className="ml-3 opacity-90">ou navegue pelas <Link to="/ads" className="underline text-yellow-300">categorias populares</Link></span>
          </div>

          {/* Stat badges */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto px-2">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><TrendingUp /></div>
              <div>
                <div className="text-lg sm:text-xl font-bold">10M+</div>
                <div className="text-xs sm:text-sm opacity-80">Anúncios Ativos</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><ShieldCheck /></div>
              <div>
                <div className="text-lg sm:text-xl font-bold">100%</div>
                <div className="text-xs sm:text-sm opacity-80">Seguro & Confiável</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Clock /></div>
              <div>
                <div className="text-lg sm:text-xl font-bold">24/7</div>
                <div className="text-xs sm:text-sm opacity-80">Suporte Online</div>
              </div>
            </div>
          </div>

          {/* Visitantes únicos no período */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center">
           
          </div>
        </div>
      </section>

      {/* Categories tiles removed by request */}

          {/* Special Ads Carousel */}
          

          {/* Featured */}
          <section className="mb-12">
            
            <FeaturedAds />
          </section>

      <section className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Anúncios Recentes</h2>
          
          {/* Filtros rápidos */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedAdType('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedAdType === ''
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedAdType('sale')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedAdType === 'sale'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Venda
            </button>
            <button
              onClick={() => setSelectedAdType('rent')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedAdType === 'rent'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Locação
            </button>
          </div>
        </div>
        <AdGrid adTypeFilter={selectedAdType} />
      </section>

      <section className="mb-12">
        
        <SpecialAdsCarousel onAdClick={(ad) => navigate(`/ads/${ad.id}`)} />
        <FooterAds />
      </section>

      <section className="bg-gray-100 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Por que escolher o Venha Vender?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-orange-600">Planos Flexíveis</h3>
            <p className="text-gray-600">Escolha entre planos gratuitos e premium para atender suas necessidades.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-orange-600">Anúncios Personalizados</h3>
            <p className="text-gray-600">Destaque seu produto com anúncios em posições especiais.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-orange-600">Chat Integrado</h3>
            <p className="text-gray-600">Comunique-se diretamente com compradores interessados.</p>
          </div>
        </div>
      </section>
    </div>
  );
}