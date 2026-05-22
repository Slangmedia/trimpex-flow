const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.renderItem.findMany({
    include: {
      versions: {
        orderBy: { version_number: 'desc' }
      }
    }
  });
  
  items.forEach(item => {
    const current = item.versions.find(v => v.is_current_version) || item.versions[0];
    console.log(`Render: ${item.name} (${item.sku_code})`);
    console.log(`  Current Status: ${item.current_status}`);
    console.log(`  Current Version: V${item.current_version}`);
    if (current) {
      console.log(`    Admin Action: ${current.admin_action}`);
      console.log(`    Client Action: ${current.client_action}`);
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
