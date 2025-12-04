'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CalendarDays, DollarSign, TrendingUp, Scissors, Plus, Search, Users } from 'lucide-react';
import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';
import StatsCard from '@/components/stats-card';
import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

interface Client {
  id: string;
  name: string;
  phone?: string;
}

interface Appointment {
  id: string;
  date: string;
  value: number;
  serviceType: string;
  paymentMethod: string;
  client?: Client;
}

interface DailyReport {
  date: string;
  appointments: Appointment[];
  totalAppointments: number;
  grossRevenue: number;
  dailyFixedCost: number;
  netProfit: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchClient, setSearchClient] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    value: '',
    serviceType: 'Corte Masculino',
    paymentMethod: 'Dinheiro',
    clientId: '',
    clientName: '',
    clientPhone: ''
  });
  const [isNewClient, setIsNewClient] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      loadReport(selectedDate);
      loadClients();
    }
  }, [status, selectedDate]);

  const loadReport = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/daily?date=${date}`);
      if (res?.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res?.ok) {
        const data = await res.json();
        setClients(data || []);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        date: new Date(formData.date).toISOString(),
        value: parseFloat(formData.value),
        serviceType: formData.serviceType,
        paymentMethod: formData.paymentMethod,
        clientId: isNewClient ? null : formData.clientId || null,
        clientName: isNewClient ? formData.clientName : null,
        clientPhone: isNewClient ? formData.clientPhone : null
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res?.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Atendimento registrado'
        });
        setIsOpen(false);
        setFormData({
          date: new Date().toISOString().slice(0, 16),
          value: '',
          serviceType: 'Corte Masculino',
          paymentMethod: 'Dinheiro',
          clientId: '',
          clientName: '',
          clientPhone: ''
        });
        setIsNewClient(false);
        loadReport(selectedDate);
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
        description: 'Erro ao salvar atendimento',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients?.filter((c) =>
    c?.name?.toLowerCase()?.includes(searchClient?.toLowerCase() || '') ||
    c?.phone?.includes(searchClient || '')
  ) || [];

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
        {/* Date selector and new appointment button */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="space-y-2">
            <Label className="text-gray-400">Data</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e?.target?.value || '')}
              className="bg-zinc-900 border-gold/20 text-white"
            />
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-black hover:bg-gold/90 font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-gold/20 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-gold">Registrar Atendimento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e?.target?.value || '' })}
                    className="bg-zinc-800 border-gold/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e?.target?.value || '' })}
                    className="bg-zinc-800 border-gold/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Serviço</Label>
                  <Select value={formData.serviceType} onValueChange={(val) => setFormData({ ...formData, serviceType: val })}>
                    <SelectTrigger className="bg-zinc-800 border-gold/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-gold/20">
                      <SelectItem value="Corte Masculino">Corte Masculino</SelectItem>
                      <SelectItem value="Barba">Barba</SelectItem>
                      <SelectItem value="Corte + Barba">Corte + Barba</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.paymentMethod} onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}>
                    <SelectTrigger className="bg-zinc-800 border-gold/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-gold/20">
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Crédito">Crédito</SelectItem>
                      <SelectItem value="Débito">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Cliente</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNewClient(!isNewClient)}
                      className="text-gold hover:text-gold/80"
                    >
                      {isNewClient ? 'Selecionar Existente' : 'Novo Cliente'}
                    </Button>
                  </div>

                  {isNewClient ? (
                    <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg">
                      <Input
                        placeholder="Nome do cliente"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e?.target?.value || '' })}
                        className="bg-zinc-800 border-gold/20"
                        required={isNewClient}
                      />
                      <Input
                        placeholder="Telefone (opcional)"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData({ ...formData, clientPhone: e?.target?.value || '' })}
                        className="bg-zinc-800 border-gold/20"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Buscar cliente..."
                          value={searchClient}
                          onChange={(e) => setSearchClient(e?.target?.value || '')}
                          className="pl-10 bg-zinc-800 border-gold/20"
                        />
                      </div>
                      <Select value={formData.clientId} onValueChange={(val) => setFormData({ ...formData, clientId: val })}>
                        <SelectTrigger className="bg-zinc-800 border-gold/20">
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-gold/20 max-h-60">
                          {filteredClients?.length > 0 ? (
                            filteredClients.map((client) => (
                              <SelectItem key={client?.id} value={client?.id || ''}>
                                {client?.name} {client?.phone ? `- ${client?.phone}` : ''}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-gray-400">Nenhum cliente encontrado</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full bg-gold text-black hover:bg-gold/90" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Atendimento'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Atendimentos"
            value={report?.totalAppointments || 0}
            icon={Scissors}
          />
          <StatsCard
            title="Faturamento Bruto"
            value={formatCurrency(report?.grossRevenue || 0)}
            icon={DollarSign}
          />
          <StatsCard
            title="Custo Fixo Diário"
            value={formatCurrency(report?.dailyFixedCost || 0)}
            icon={CalendarDays}
            iconColor="text-orange-500"
          />
          <StatsCard
            title="Lucro Líquido"
            value={formatCurrency(report?.netProfit || 0)}
            icon={TrendingUp}
            iconColor={report && report?.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}
          />
        </div>

        {/* Appointments list */}
        <Card className="bg-zinc-900 border-gold/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-gold" />
              Atendimentos do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report?.appointments && report?.appointments?.length > 0 ? (
              <div className="space-y-3">
                {report?.appointments?.map((apt) => (
                  <div
                    key={apt?.id}
                    className="p-4 bg-zinc-800 rounded-lg border border-gold/10 hover:border-gold/30 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">
                          {apt?.client?.name || 'Cliente não informado'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {apt?.serviceType} • {apt?.paymentMethod}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(apt?.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gold">
                          {formatCurrency(apt?.value)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Scissors className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum atendimento registrado nesta data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}
