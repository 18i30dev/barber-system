import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'john@doe.com' }
  });

  if (existingUser) {
    console.log('Test user already exists. Skipping seed.');
    return;
  }

  // Create test user
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@doe.com',
      password: hashedPassword
    }
  });

  console.log('Test user created:', user.email);

  // Create default settings for the user
  await prisma.barberSettings.create({
    data: {
      userId: user.id,
      barberShopName: 'Barbearia do João',
      monthlyFixedCost: 2000,
      daysToConsiderInactive: 30,
      reengagementMessage:
        'Fala, [NOME_CLIENTE]! Aqui é da [NOME_BARBEARIA], sentimos sua falta por aqui. Que tal marcar um horário essa semana?'
    }
  });

  console.log('Default settings created');

  // Create some test clients
  const client1 = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Carlos Silva',
      phone: '11987654321',
      acceptsWhatsApp: true,
      totalVisits: 5,
      lastAppointmentDate: new Date('2024-11-15')
    }
  });

  const client2 = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Pedro Santos',
      phone: '11976543210',
      acceptsWhatsApp: true,
      totalVisits: 3,
      lastAppointmentDate: new Date('2024-10-20')
    }
  });

  const client3 = await prisma.client.create({
    data: {
      userId: user.id,
      name: 'Lucas Oliveira',
      phone: '11965432109',
      acceptsWhatsApp: true,
      totalVisits: 8,
      lastAppointmentDate: new Date('2024-12-01')
    }
  });

  console.log('Test clients created');

  // Create some test appointments
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.appointment.create({
    data: {
      userId: user.id,
      clientId: client1.id,
      date: today,
      value: 50,
      serviceType: 'Corte Masculino',
      paymentMethod: 'Pix'
    }
  });

  await prisma.appointment.create({
    data: {
      userId: user.id,
      clientId: client3.id,
      date: today,
      value: 80,
      serviceType: 'Corte + Barba',
      paymentMethod: 'Débito'
    }
  });

  await prisma.appointment.create({
    data: {
      userId: user.id,
      clientId: client1.id,
      date: yesterday,
      value: 50,
      serviceType: 'Corte Masculino',
      paymentMethod: 'Dinheiro'
    }
  });

  await prisma.appointment.create({
    data: {
      userId: user.id,
      clientId: client2.id,
      date: yesterday,
      value: 40,
      serviceType: 'Barba',
      paymentMethod: 'Crédito'
    }
  });

  console.log('Test appointments created');
  console.log('Seed completed successfully!');
  console.log('\nTest account:');
  console.log('Email: john@doe.com');
  console.log('Password: johndoe123');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
