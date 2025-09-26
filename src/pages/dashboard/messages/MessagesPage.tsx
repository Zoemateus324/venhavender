import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { MessageSquare, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  ad: {
    id: string;
    title: string;
  };
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchMessages();
  }, [user, filter]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('messages')
        .select(`
          id, 
          message,
          created_at,
          read,
          sender:sender_id(*),
          ad:ad_id(*)
        `)
        .eq('receiver_id', user.id);

      if (filter === 'unread') {
        query = query.eq('read', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        content: row.message,
        created_at: row.created_at,
        read: row.read,
        sender: row.sender,
        ad: row.ad,
      }));
      setMessages(mapped);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar suas mensagens.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, read: true };
        }
        return msg;
      }));
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMessages = messages.filter(message => {
    if (searchQuery === '') return true;
    
    const query = searchQuery.toLowerCase();
    return (
      message.content.toLowerCase().includes(query) ||
      message.sender.name.toLowerCase().includes(query) ||
      message.ad.title.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mensagens</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'all' ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700 hover:text-orange-600 active:text-orange-600 focus:text-orange-600'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'unread' ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700 hover:text-orange-600 active:text-orange-600 focus:text-orange-600'}`}
          >
            Não lidas
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar mensagens..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredMessages.length > 0 ? (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div 
              key={message.id} 
              className={`p-4 border rounded-lg ${message.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
              onClick={() => {
                if (!message.read) markAsRead(message.id);
              }}
            >
              <Link to={`/dashboard/messages/${message.id}`} className="block">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">{message.sender.name}</p>
                      {!message.read && (
                        <span className="ml-2 bg-blue-500 rounded-full w-2 h-2"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Sobre: {message.ad.title}</p>
                    <p className="text-sm mt-2 line-clamp-2">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="flex justify-center mb-4">
            <MessageSquare size={48} className="text-gray-400" />
          </div>
          <p className="text-gray-500">
            {searchQuery ? 'Nenhuma mensagem encontrada para sua busca.' : 
              filter === 'unread' ? 'Você não tem mensagens não lidas.' : 'Você ainda não tem mensagens.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;