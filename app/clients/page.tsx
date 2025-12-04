'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Search, Plus, Edit, Trash2, Phone } from 'lucide-react';
import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';
import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { formatPhone, formatDate } from '@/lib/formatters';

interface Client {
  id: string;
  name: string;
  phone?: string;
  acceptsWhatsApp: boolean;
  lastAppointmentDate?: string;
  totalVisits: number;
}

export default function ClientsPage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    acceptsWhatsApp: true
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadClients();
    }
  }, [status]);

  const loadClients = async (search?: string) => {
    setIsLoading(true);
    try {
      const url = search ? `/api/clients?search=${encodeURIComponent(search)}` : '/api/clients';
      const res = await fetch(url);
      if (res?.ok) {
        const data = await res.json();
        setClients(data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        loadClients(searchTerm);
      } else {
        loadClients();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenNew = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', acceptsWhatsApp: true });
    setIsOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      acceptsWhatsApp: client.acceptsWhatsApp
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res?.ok) {
        toast({
          title: 'Sucesso!',
          description: editingClient ? 'Cliente atualizado' : 'Cliente criado'
        });
        setIsOpen(false);
        loadClients();
      } else {
        const error = await res.json();
        toast({
          title: 'Erro',
          description: error?.error || 'Erro ao salvar',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar cliente',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res?.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Cliente removido'
        });
        loadClients();
      } else {
        const error = await res.json();
        toast({
          title: 'Erro',
          description: error?.error || 'Erro ao remover',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover cliente',
        variant: 'destructive'
      });
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <Loading />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header />

      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Clientes</h1>
            <p className="text-gray-400 text-sm">Gerencie sua base de clientes</p>
          </div>
          <Button onClick={handleOpenNew} className="bg-gold text-black hover:bg-gold/90 font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value || '')}
            className="pl-10 bg-zinc-900 border-gold/20 text-white"
          />
        </div>

        {/* Clients list */}
        <Card className="bg-zinc-900 border-gold/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              Total: {clients?.length || 0} clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clients && clients?.length > 0 ? (
              <div className="space-y-3">
                {clients.map((client) => (
                  <div
                    key={client?.id}
                    className="p-4 bg-zinc-800 rounded-lg border border-gold/10 hover:border-gold/30 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-white">{client?.name}</p>
                        {client?.phone && (
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {formatPhone(client?.phone)}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span>{client?.totalVisits} visitas</span>
                          {client?.lastAppointmentDate && (
                            <span>Último atendimento: {formatDate(client?.lastAppointmentDate)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(client)}
                          className="text-gold hover:text-gold/80 hover:bg-gold/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client?.id)}
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum cliente encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-zinc-900 border-gold/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-gold">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e?.target?.value || '' })}
                  className="bg-zinc-800 border-gold/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(11) 98765-4321"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e?.target?.value || '' })}
                  className="bg-zinc-800 border-gold/20"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsapp"
                  checked={formData.acceptsWhatsApp}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptsWhatsApp: checked === true })
                  }
                />
                <Label htmlFor="whatsapp" className="cursor-pointer">
                  Aceita receber mensagens no WhatsApp
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gold text-black hover:bg-gold/90"
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : editingClient ? 'Atualizar' : 'Criar Cliente'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNav />
    </div>
  );
}
