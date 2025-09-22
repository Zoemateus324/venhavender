import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Ad } from '../../types'
import AdCard from '../../components/AdCard'

export default function MyAdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadAds() {
      try {
        if (!user) return;
        
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        setAds(data || []);
      } catch (error) {
        console.error('Error loading ads:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAds()
  }, [user])

  function handleCreateNewAd() {
    navigate('/ads/new')
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Please login to view your ads</h1>
        <button 
          onClick={() => navigate('/login')}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
        >
          Login
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Ads</h1>
        <button 
          onClick={handleCreateNewAd}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
        >
          Create New Ad
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl text-gray-600">You haven't created any ads yet.</p>
          <button 
            onClick={handleCreateNewAd}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded mt-4"
          >
            Create Your First Ad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              onEdit={() => navigate(`/ads/${ad.id}/edit`)}
              onDelete={async () => {
                try {
                  const { error } = await supabase
                    .from('ads')
                    .delete()
                    .eq('id', ad.id);
                    
                  if (error) throw error;
                  setAds((prevAds) => prevAds.filter((a) => a.id !== ad.id));
                } catch (error) {
                  console.error('Error deleting ad:', error);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
