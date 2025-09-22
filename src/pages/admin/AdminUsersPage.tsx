import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { User, Edit, Trash2, Search, MoreHorizontal, Shield, ShieldOff, UserCheck, UserX } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  avatar_url?: string;
  phone?: string;
  status: 'active' | 'suspended' | 'pending';
  ads_count: number;
  last_login?: string;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('users')
        .select(`
          id, 
          name, 
          email, 
          role, 
          created_at, 
          avatar_url,
          phone,
          status,
          last_login
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch ad counts for each user
      const usersWithAdCounts = await Promise.all(
        (data || []).map(async (user) => {
          const { count, error: adError } = await supabase
            .from('ads')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

          return {
            ...user,
            ads_count: count || 0
          };
        })
      );

      setUsers(usersWithAdCounts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter users locally based on search query
    // In a real app, you might want to do this server-side
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
      toast.success(`Função do usuário alterada para ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Erro ao atualizar função do usuário');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended' | 'pending') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => user.id === userId ? { ...user, status: newStatus } : user));
      toast.success(`Status do usuário alterado para ${newStatus}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Erro ao atualizar status do usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita e excluirá todos os anúncios associados.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== userId));
      toast.success('Usuário excluído com sucesso');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleBulkAction = async (action: 'makeAdmin' | 'removeAdmin' | 'activate' | 'suspend' | 'delete') => {
    if (selectedUsers.length === 0) return;

    if (action === 'delete' && !confirm(`Tem certeza que deseja excluir ${selectedUsers.length} usuários? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('users')
          .delete()
          .in('id', selectedUsers);

        if (error) throw error;

        setUsers(users.filter(user => !selectedUsers.includes(user.id)));
        toast.success(`${selectedUsers.length} usuários excluídos com sucesso`);
      } else if (action === 'makeAdmin' || action === 'removeAdmin') {
        const newRole = action === 'makeAdmin' ? 'admin' : 'user';
        const { error } = await supabase
          .from('users')
          .update({ role: newRole })
          .in('id', selectedUsers);

        if (error) throw error;

        setUsers(users.map(user => selectedUsers.includes(user.id) ? { ...user, role: newRole } : user));
        toast.success(`${selectedUsers.length} usuários atualizados para ${newRole}`);
      } else {
        const newStatus = action === 'activate' ? 'active' : 'suspended';
        const { error } = await supabase
          .from('users')
          .update({ status: newStatus })
          .in('id', selectedUsers);

        if (error) throw error;

        setUsers(users.map(user => selectedUsers.includes(user.id) ? { ...user, status: newStatus as any } : user));
        toast.success(`${selectedUsers.length} usuários ${action === 'activate' ? 'ativados' : 'suspensos'} com sucesso`);
      }

      setSelectedUsers([]);
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
      toast.error(`Erro ao executar ação em massa`);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'suspended':
        return 'Suspenso';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
        <div className="flex items-center space-x-2">
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('makeAdmin')}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <Shield size={16} className="mr-1" />
                Tornar Admin ({selectedUsers.length})
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <UserCheck size={16} className="mr-1" />
                Ativar ({selectedUsers.length})
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <UserX size={16} className="mr-1" />
                Suspender ({selectedUsers.length})
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <Trash2 size={16} className="mr-1" />
                Excluir ({selectedUsers.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-sm">Função:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todas</option>
                <option value="admin">Admin</option>
                <option value="user">Usuário</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-sm">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-sm">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="created_at">Data de cadastro</option>
                <option value="name">Nome</option>
                <option value="email">Email</option>
                <option value="last_login">Último login</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
          </div>
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <User size={48} className="mb-4 opacity-20" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anúncios
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-600">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
                        {getStatusText(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? formatDate(user.last_login) : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.ads_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        
                        {showActionMenu === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                            <div className="py-1">
                              {user.role !== 'admin' ? (
                                <button
                                  onClick={() => {
                                    handleRoleChange(user.id, 'admin');
                                    setShowActionMenu(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Shield size={16} className="mr-2" />
                                  Tornar Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleRoleChange(user.id, 'user');
                                    setShowActionMenu(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <ShieldOff size={16} className="mr-2" />
                                  Remover Admin
                                </button>
                              )}
                              
                              {user.status !== 'active' ? (
                                <button
                                  onClick={() => {
                                    handleStatusChange(user.id, 'active');
                                    setShowActionMenu(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <UserCheck size={16} className="mr-2" />
                                  Ativar Usuário
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleStatusChange(user.id, 'suspended');
                                    setShowActionMenu(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-orange-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <UserX size={16} className="mr-2" />
                                  Suspender Usuário
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  handleDeleteUser(user.id);
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Excluir Usuário
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;