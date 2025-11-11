import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Primeiro, verificar se o usuário existe na tabela users para obter o role
      // Usar maybeSingle() para evitar erro 406 quando usuário não existe ainda
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // Tentar buscar da tabela user_plans
      const { data: userPlan, error: userPlanError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!userPlanError && userPlan) {
        // Se encontrou na tabela user_plans, usar esses dados
        setUser({
          id: userId,
          email: supabaseUser?.email || '',
          name: supabaseUser?.user_metadata?.name || 'Usuário',
          role: userData?.role || 'user', // Usar o role da tabela users se disponível
          plan_type: userPlan.plan_type || 'free',
          plan_status: userPlan.plan_status || 'inactive',
          plan_expires_at: userPlan.plan_expires_at
        });
        setLoading(false);
        return;
      }

      // Se não encontrou na tabela user_plans, criar um usuário padrão
      const defaultUser = {
        id: userId,
        email: supabaseUser?.email || '',
        name: supabaseUser?.user_metadata?.name || 'Usuário',
        role: userData?.role || 'user', // Usar o role da tabela users se disponível
        plan_type: 'free',
        plan_status: 'inactive',
        plan_expires_at: null
      };

      setUser(defaultUser);
      
      // Tentar criar registro na tabela user_plans (se existir)
      try {
        await supabase.from('user_plans').insert([{
          user_id: userId,
          plan_type: 'free',
          plan_status: 'inactive'
        }]);
      } catch (insertError) {
        // Ignorar erro se a tabela não existir ainda
        console.debug('Could not create user_plans record:', insertError);
      }
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Em caso de erro, criar usuário padrão
      setUser({
        id: userId,
        email: supabaseUser?.email || '',
        name: supabaseUser?.user_metadata?.name || 'Usuário',
        role: 'user',
        plan_type: 'free',
        plan_status: 'inactive',
        plan_expires_at: null
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Primeiro, fazer login no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) throw authError;
    
    // Verificar se o usuário existe na tabela users
    if (authData.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();
      
      // Se o usuário não existe na tabela users, fazer logout e negar acesso
      if (userError || !userData) {
        await supabase.auth.signOut();
        throw new Error('Conta não encontrada. Por favor, registre-se primeiro.');
      }
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email,
          name,
          phone,
          role: 'user',
          plan_type: 'free',
          plan_status: 'inactive'
        }]);

      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout.');
      throw error;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      if (!email) throw new Error('Informe seu e-mail');
      const redirectTo = `${window.location.origin}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      toast.success('Se existir uma conta, enviamos um e-mail para redefinição.');
    } catch (error) {
      console.error('Error requesting password reset:', error);
      toast.error('Não foi possível enviar o e-mail de redefinição.');
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!supabaseUser?.email) throw new Error('Sessão inválida');
      if (!currentPassword || !newPassword) throw new Error('Preencha as senhas');

      // Reautentica para garantir permissão de alterar senha
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: supabaseUser.email,
        password: currentPassword
      });
      if (reauthError) throw new Error('Senha atual incorreta');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Não foi possível alterar a senha.');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh user data
      fetchUserProfile(user.id);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil.');
      throw error;
    }
  };

  const value = {
    user,
    supabaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    requestPasswordReset,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}