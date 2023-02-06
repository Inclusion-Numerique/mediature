import { CaseStatus, PhoneType, PrismaClient } from '@prisma/client';

import { AuthorityTypeSchema } from '@mediature/main/src/models/entities/authority';

export async function truncateDatabase(prismaClient: PrismaClient) {
  const tablenames = await prismaClient.$queryRaw<Array<{ tablename: string }>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prismaClient.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
}

export async function seedDatabase(prismaClient: PrismaClient) {
  // Empty all tables to avoid managing upserts+conditions+fixedUuids
  await truncateDatabase(prismaClient);

  const testUserId = '5c03994c-fc16-47e0-bd02-d218a370a078';
  const sssId = '5c03994c-fc16-47e0-bd02-d218a370a111';

  // Create main user
  const mainUser = await prismaClient.user.upsert({
    where: {
      id: testUserId,
    },
    create: {
      id: testUserId,
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@domain.demo',
      passwordHash: '$2a$11$L2SjShQuoJoYqMPmoINuWeRLRWnzNuQf22.VgculPIlpnS8bleLEG', // Value: "test"
      status: 'CONFIRMED',
      profilePicture: null,
      Admin: {
        create: {
          canEverything: true,
        },
      },
    },
    update: {},
  });

  // Create 3 authorities
  const parisAuthority = await prismaClient.authority.create({
    data: {
      name: 'Mairie de Paris',
      slug: 'maire-de-paris',
      type: AuthorityTypeSchema.Values.CITY,
    },
  });

  const bretagneAuthority = await prismaClient.authority.create({
    data: {
      name: 'Région Bretagne',
      slug: 'bretagne',
      type: AuthorityTypeSchema.Values.CITY,
    },
  });

  const sssAuthority = await prismaClient.authority.create({
    data: {
      id: sssId,
      name: 'Seine-Saint-Denis',
      slug: 'seine-saint-denis',
      type: AuthorityTypeSchema.Values.SUBDIVISION,
    },
  });

  // Add the main user as an agent in an authority
  const bretagneAgent = await prismaClient.agent.create({
    data: {
      user: {
        connect: {
          id: mainUser.id,
        },
      },
      authority: {
        connect: {
          id: bretagneAuthority.id,
        },
      },
    },
  });

  // Set the main user as "main" in an authority
  await prismaClient.authority.update({
    where: {
      id: bretagneAuthority.id,
    },
    data: {
      mainAgent: {
        connect: {
          id: bretagneAgent.id,
        },
      },
    },
  });

  // Add the main user as an agent in an authority
  const sssAgent = await prismaClient.agent.create({
    data: {
      user: {
        connect: {
          id: mainUser.id,
        },
      },
      authority: {
        connect: {
          id: sssAuthority.id,
        },
      },
    },
  });

  // Set the main user as "main" in an authority
  await prismaClient.authority.update({
    where: {
      id: sssAuthority.id,
    },
    data: {
      mainAgent: {
        connect: {
          id: sssAgent.id,
        },
      },
    },
  });

  // Create cases
  await [...Array(20)].map(async () => {
    await prismaClient.case.create({
      data: {
        alreadyRequestedInThePast: false,
        gotAnswerFromPreviousRequest: null,
        description:
          'Omnis dolor facere quis temporibus veniam dolore quasi inventore. Non repellat autem necessitatibus. Assumenda nihil veritatis laboriosam fugit. Quae non occaecati. Dolor accusantium doloribus quos. Nihil qui qui omnis vel.',
        units: '',
        emailCopyWanted: false,
        termReminderAt: new Date(),
        status: CaseStatus.TO_PROCESS,
        closedAt: null,
        finalConclusion: null,
        nextRequirements: null,
        citizen: {
          create: {
            email: 'savin@yahoo.fr',
            firstname: 'Savin',
            lastname: 'Deschamps',
            address: {
              create: {
                street: '',
                city: '',
                postalCode: '',
                countryCode: '',
                subdivision: '',
              },
            },
            phone: {
              create: {
                phoneType: PhoneType.UNSPECIFIED,
                callingCode: '',
                countryCode: '',
                number: '',
              },
            },
          },
        },
        authority: {
          connect: {
            id: sssAuthority.id,
          },
        },
      },
    });
  });
}
