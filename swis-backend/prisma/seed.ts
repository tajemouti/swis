import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Permission format: "<module>.<action>" — action is one of create, read, update, delete
const MODULES = [
  'users',
  'vehicles',
  'drivers',
  'routes',
  'containers',
  'maintenance',
  'incidents',
  'complaints',
  'reports',
  'audit_logs',
] as const;

const ACTIONS = ['create', 'read', 'update', 'delete'] as const;

// RBAC matrix derived from the approved design doc.
// 'full' = create/read/update/delete, 'read' = read only, omitted = no access
const ROLE_MATRIX: Record<RoleName, Record<string, 'full' | 'read'>> = {
  ADMINISTRATOR: Object.fromEntries(MODULES.map((m) => [m, 'full'])) as Record<
    string,
    'full' | 'read'
  >,
  OPERATIONS_MANAGER: {
    users: 'read',
    routes: 'full',
    containers: 'read',
    incidents: 'full',
    complaints: 'full',
    reports: 'full',
    maintenance: 'read',
    vehicles: 'read',
    drivers: 'read',
  },
  FLEET_SUPERVISOR: {
    vehicles: 'full',
    drivers: 'full',
    routes: 'read',
    maintenance: 'read',
    reports: 'read',
  },
  MAINTENANCE_SUPERVISOR: {
    maintenance: 'full',
    vehicles: 'read',
  },
  FIELD_CONTROLLER: {
    incidents: 'full',
    routes: 'read',
    containers: 'read',
    drivers: 'read',
  },
  DISPATCHER: {
    routes: 'full',
    vehicles: 'read',
    drivers: 'read',
    containers: 'read',
    reports: 'read',
  },
};

async function main() {
  console.warn('Seeding permissions...');
  const permissionRecords = MODULES.flatMap((module) =>
    ACTIONS.map((action) => ({ name: `${module}.${action}`, module })),
  );

  for (const perm of permissionRecords) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  console.warn('Seeding roles...');
  const roleDescriptions: Record<RoleName, string> = {
    ADMINISTRATOR: 'Full system control',
    OPERATIONS_MANAGER: 'Oversees daily operations and KPIs',
    FLEET_SUPERVISOR: 'Manages vehicles and drivers',
    MAINTENANCE_SUPERVISOR: 'Manages maintenance operations',
    FIELD_CONTROLLER: 'Field agent tracking incidents and route execution',
    DISPATCHER: 'Plans routes and assigns tasks',
  };

  for (const roleName of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: roleDescriptions[roleName] },
    });

    const allowedModules = ROLE_MATRIX[roleName];
    const permissionNames: string[] = [];
    for (const [module, level] of Object.entries(allowedModules)) {
      if (level === 'full') {
        for (const action of ACTIONS) permissionNames.push(`${module}.${action}`);
      } else {
        permissionNames.push(`${module}.read`);
      }
    }

    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }

  console.warn('Seeding default admin user...');
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.ADMINISTRATOR },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@swis.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.warn(`Seed complete. Admin login: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
