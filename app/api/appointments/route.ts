import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { date, value, serviceType, paymentMethod, clientId, clientName, clientPhone } = body;

    if (!date || !value || !serviceType || !paymentMethod) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    let finalClientId = clientId;

    // If new client, create it first
    if (!clientId && clientName) {
      const newClient = await prisma.client.create({
        data: {
          userId: session.user.id,
          name: clientName,
          phone: clientPhone || null,
          totalVisits: 1,
          lastAppointmentDate: new Date(date)
        }
      });
      finalClientId = newClient.id;
    } else if (finalClientId) {
      // Update existing client
      await prisma.client.update({
        where: { id: finalClientId },
        data: {
          lastAppointmentDate: new Date(date),
          totalVisits: { increment: 1 }
        }
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: session.user.id,
        clientId: finalClientId || null,
        date: new Date(date),
        value: parseFloat(value.toString()),
        serviceType,
        paymentMethod
      },
      include: {
        client: true
      }
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Appointment creation error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar atendimento' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    let appointments;

    if (date) {
      // Get appointments for specific date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      appointments = await prisma.appointment.findMany({
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
    } else if (month) {
      // Get appointments for specific month (YYYY-MM)
      const [year, monthNum] = month.split('-').map(Number);
      const startOfMonth = new Date(year, monthNum - 1, 1);
      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);

      appointments = await prisma.appointment.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        include: {
          client: true
        },
        orderBy: {
          date: 'desc'
        }
      });
    } else {
      // Get all appointments
      appointments = await prisma.appointment.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          client: true
        },
        orderBy: {
          date: 'desc'
        },
        take: 50
      });
    }

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Appointments fetch error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar atendimentos' },
      { status: 500 }
    );
  }
}
