'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { UserX, MessageCircle, Calendar } from 'lucide-react';
import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';
import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatPhone, formatPhoneForWhatsApp } from '@/lib/formatters';

interface InactiveClient {
  id: string;
  name: string;
  phone?: string;
  lastAppointmentDate?: string;
  totalVisits: number;
}

interface Settings {
  barberShopName?: string;
  reengagementMessage: string;
  daysToConsiderInactive: number;
}

export default function ReengagementPage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<InactiveClient[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, settingsRes] = await Promise.all([
        fetch('/api/clients/inactive'),
        fetch('/api/settings')
      ]);

      if (clientsRes?.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData || []);
      }

      if (settingsRes?.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysSinceLastVisit = (lastDate?: string) => {
    if (!lastDate) return 'Nunca';
    const diff = Date.now() - new Date(lastDate).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} dias`;
  };

  const handleWhatsApp = (client: InactiveClient) => {
    if (!client?.phone) {
      toast({
        title: 'Sem telefone',
        description: 'Este cliente não possui telefone cadastrado',
        variant: 'destructive'
      });
      return;
    }

    let message = settings?.reengagementMessage || 'Olá [NOME_CLIENTE]!';
    message = message.replace('[NOME_CLIENTE]', client?.name || '');
    message = message.replace('[NOME_BARBEARIA]', settings?.barberShopName || 'nossa barbearia');

    const phoneNumber = formatPhoneForWhatsApp(client?.phone);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
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
        <div>
          <h1 className="text-2xl font-bold text-white">Reengajamento</h1>
          <p className="text-gray-400 text-sm">
            Clientes inativos há mais de {settings?.daysToConsiderInactive || 30} dias
          </p>
        </div>

        {/* Inactive clients list */}
        <Card className="bg-zinc-900 border-gold/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserX className="w-5 h-5 text-orange-500" />
              {clients?.length || 0} clientes para reengajar
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
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-white text-lg">{client?.name}</p>
                        {client?.phone && (
                          <p className="text-sm text-gray-400">
                            {formatPhone(client?.phone)}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {getDaysSinceLastVisit(client?.lastAppointmentDate)} sem aparecer
                          </span>
                          <span>{client?.totalVisits} visitas anteriores</span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          onClick={() => handleWhatsApp(client)}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                          disabled={!client?.phone}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <UserX className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">Parabéns!</p>
                <p>Nenhum cliente inativo no momento</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message preview */}
        {settings && (
          <Card className="bg-zinc-900 border-gold/20">
            <CardHeader>
              <CardTitle className="text-white text-sm">Mensagem de Reengajamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-zinc-800 rounded-lg text-sm text-gray-300">
                <p className="whitespace-pre-wrap">{settings?.reengagementMessage}</p>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Personalize esta mensagem nas configurações
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
