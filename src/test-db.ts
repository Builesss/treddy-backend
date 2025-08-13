import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Conectando a la base de datos...");

  const usuarios = await prisma.usuarios.findMany();

  console.log("✅ Conexión exitosa, usuarios encontrados:");
  console.log(usuarios);
}

main()
  .catch((e) => {
    console.error("❌ Error al conectar o consultar:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
