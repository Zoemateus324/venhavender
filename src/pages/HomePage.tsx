import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FeaturedAds from '../components/FeaturedAds';
import AdGrid from '../components/AdGrid';
import FooterAds from '../components/FooterAds';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import { TrendingUp, ShieldCheck, Clock } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => setCategories(data || []));
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
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 rounded-2xl p-10 text-white shadow-lg">
          {/* Decorative blurred shapes */}
          <div className="pointer-events-none absolute -top-10 -left-10 w-72 h-72 bg-white/10 blur-3xl rounded-full" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 w-80 h-80 bg-yellow-300/20 blur-3xl rounded-full" />

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-3 text-center">
            Encontre tudo o que<br/>
            <span className="text-yellow-300">você precisa</span>
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 text-center">A maior plataforma de classificados do Brasil.</p>
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="bg-white rounded-full p-2 flex items-center gap-2 shadow mx-auto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="O que você está procurando? Ex: iPhone, apartamento, carro..."
                className="flex-1 px-4 py-3 rounded-full text-gray-700 focus:outline-none"
              />
              <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-full font-medium">Buscar</button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <Link to="/dashboard/ads/create" className="inline-block bg-yellow-400 text-gray-900 font-semibold px-6 py-2 rounded-full hover:bg-yellow-300">Anunciar Grátis</Link>
            <span className="ml-3 opacity-90">ou navegue pelas <Link to="/ads" className="underline text-yellow-300">categorias populares</Link></span>
          </div>

          {/* Stat badges */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><TrendingUp /></div>
              <div>
                <div className="text-xl font-bold">10M+</div>
                <div className="text-sm opacity-80">Anúncios Ativos</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><ShieldCheck /></div>
              <div>
                <div className="text-xl font-bold">100%</div>
                <div className="text-sm opacity-80">Seguro & Confiável</div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Clock /></div>
              <div>
                <div className="text-xl font-bold">24/7</div>
                <div className="text-sm opacity-80">Suporte Online</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories tiles */}
      <section className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} to={`/ads?category=${c.id}`} className="bg-white rounded-xl shadow p-6 text-center hover:shadow-lg">
              <div className="text-gray-700 font-medium">{c.name}</div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-4">
          <Link to="/ads" className="text-blue-600 hover:underline">Ver todas as categorias →</Link>
        </div>
      </section>

      {/* Featured */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Anúncios em Destaque</h2>
        <FeaturedAds />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Anúncios Recentes</h2>
        <AdGrid />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Anúncios Especiais</h2>
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