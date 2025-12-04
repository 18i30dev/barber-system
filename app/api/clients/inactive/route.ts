import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Get barber settings to know the inactivity threshold
    const settings = await prisma.barberSettings.findUnique({
      where: { userId: session.user.id }
    });

    const daysThreshold = settings?.daysToConsiderInactive || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    // Get inactive clients
    const inactiveClients = await prisma.client.findMany({
      where: {
        userId: session.user.id,
        lastAppointmentDate: {
          lt: thresholdDate
        },
        acceptsWhatsApp: true
      },
      orderBy: {
        lastAppointmentDate: 'asc'
      }
    });

    return NextResponse.json(inactiveClients);
  } catch (error) {
    console.error('Inactive clients fetch error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes inativos' },
      { status: 500 }
    );
  }
}
