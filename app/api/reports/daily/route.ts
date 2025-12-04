import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        client: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const settings = await prisma.barberSettings.findUnique({
      where: { userId: session.user.id }
    });

    const totalAppointments = appointments.length;
    const grossRevenue = appointments.reduce((sum, apt) => sum + Number(apt.value), 0);
    const dailyFixedCost = settings?.monthlyFixedCost ? Number(settings.monthlyFixedCost) / 30 : 0;
    const netProfit = grossRevenue - dailyFixedCost;

    return NextResponse.json({
      date: dateStr,
      appointments,
      totalAppointments,
      grossRevenue,
      dailyFixedCost,
      netProfit
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório diário' },
      { status: 500 }
    );
  }
}
