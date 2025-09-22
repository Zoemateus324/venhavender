import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  ad_id: string;
  read: boolean;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
  };
  ad: {
    id: string;
    title: string;
    images: string[];
  };
}

interface MessageThread {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_from_me: boolean;
}

const MessageDetailPage: React.FC = () => {
  const { messageId } = useParams<{ messageId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [originalMessage, setOriginalMessage] = useState<Message | null>(null);
  const [thread, setThread] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageId && user) {
      fetchMessageDetails();
    }
  }, [messageId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [thread]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessageDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch the original message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(*),
          receiver:receiver_id(*),
          ad:ad_id(*)
        `)
        .eq('id', messageId)
        .single();

      if (messageError) throw messageError;
      
      // Mark as read if it's not already
      if (!messageData.read && messageData.receiver_id === user?.id) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', messageId);
      }

      setOriginalMessage(messageData);

      // Fetch the entire conversation thread
      const { data: threadData, error: threadError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${messageData.sender_id},receiver_id.eq.${messageData.receiver_id}),and(sender_id.eq.${messageData.receiver_id},receiver_id.eq.${messageData.sender_id})`)
        .eq('ad_id', messageData.ad_id)
        .order('created_at', { ascending: true });

      if (threadError) throw threadError;

      const formattedThread = threadData.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        is_from_me: msg.sender_id === user?.id
      }));

      setThread(formattedThread);
    } catch (error) {
      console.error('Erro ao carregar detalhes da mensagem:', error);
      toast.error('Erro ao carregar a conversa.');
      navigate('/dashboard/messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !originalMessage || !user) return;

    try {
      setSending(true);
      
      const newMessage = {
        content: replyContent.trim(),
        sender_id: user.id,
        receiver_id: originalMessage.sender_id,
        ad_id: originalMessage.ad_id,
        read: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select();

      if (error) throw error;

      // Add the new message to the thread
      setThread([
        ...thread,
        {
          id: data[0].id,
          content: data[0].content,
          created_at: data[0].created_at,
          sender_id: data[0].sender_id,
          is_from_me: true
        }
      ]);

      setReplyContent('');
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar sua mensagem.');
    } finally {
      setSending(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!originalMessage) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">Mensagem não encontrada.</p>
        <Link to="/dashboard/messages" className="text-primary hover:underline mt-4 inline-block">
          Voltar para mensagens
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard/messages" className="inline-flex items-center text-gray-600 hover:text-primary">
          <ArrowLeft size={18} className="mr-1" /> Voltar para mensagens
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Message header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold">
                Conversa com {originalMessage.sender.name}
              </h2>
              <p className="text-sm text-gray-500">
                Sobre: <Link to={`/ads/${originalMessage.ad.id}`} className="text-primary hover:underline">
                  {originalMessage.ad.title}
                </Link>
              </p>
            </div>
            {originalMessage.ad.images && originalMessage.ad.images.length > 0 && (
              <div className="flex-shrink-0">
                <img 
                  src={originalMessage.ad.images[0]} 
                  alt={originalMessage.ad.title} 
                  className="w-16 h-16 object-cover rounded-md"
                />
              </div>
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="p-4 h-96 overflow-y-auto bg-gray-50">
          <div className="space-y-4">
            {thread.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.is_from_me ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] p-3 rounded-lg ${message.is_from_me 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white border rounded-bl-none'}`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.is_from_me ? 'text-primary-light' : 'text-gray-400'}`}>
                    {formatDate(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply form */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendReply} className="flex">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-dark transition-colors disabled:opacity-50"
              disabled={sending || !replyContent.trim()}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessageDetailPage;