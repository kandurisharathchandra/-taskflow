import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

function daysFromToday(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

const sampleTasks = [
  { title: 'Design dashboard wireframes', description: 'Sketch the stats cards and recent tasks layout.', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, dueDate: daysFromToday(-3) },
  { title: 'Set up CI pipeline', description: 'Run lint, tests and builds on every pull request.', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, dueDate: daysFromToday(2) },
  { title: 'Write API documentation', description: null, status: TaskStatus.PENDING, priority: TaskPriority.LOW, dueDate: daysFromToday(7) },
  { title: 'Fix login redirect bug', description: 'Users land on a blank page after signing in on Safari.', status: TaskStatus.PENDING, priority: TaskPriority.HIGH, dueDate: daysFromToday(-1) },
  { title: 'Plan sprint retrospective', description: null, status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM, dueDate: null },
  { title: 'Update dependencies', description: 'Bump minor versions and check the changelogs.', status: TaskStatus.COMPLETED, priority: TaskPriority.LOW, dueDate: null },
];

async function main() {
  const existing = await prisma.task.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} task(s); skipping seed.`);
    return;
  }
  await prisma.task.createMany({ data: sampleTasks });
  console.log(`Seeded ${sampleTasks.length} tasks.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
