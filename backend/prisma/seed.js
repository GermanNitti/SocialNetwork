const { PrismaClient, ShopCategory } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.badge.upsert({
    where: { code: "FOUNDER_2025" },
    update: {},
    create: {
      code: "FOUNDER_2025",
      name: "Fundador 2025",
      description: "Uno de los primeros en creer en Macanudo",
    },
  });

  const themes = [
    {
      key: "nature",
      name: "Naturaleza",
      primaryColor: "#16a34a",
      secondaryColor: "#65a30d",
      backgroundGradient: "linear-gradient(135deg, #d9f99d, #bbf7d0)",
      decorations: { leaves: true, fire: false },
    },
    {
      key: "racing",
      name: "Racing",
      primaryColor: "#ef4444",
      secondaryColor: "#0f172a",
      backgroundGradient: "linear-gradient(135deg, #0f172a, #ef4444)",
      decorations: { flags: true, sparks: true },
    },
    {
      key: "space",
      name: "Espacio",
      primaryColor: "#7c3aed",
      secondaryColor: "#0ea5e9",
      backgroundGradient: "linear-gradient(135deg, #0b1021, #312e81)",
      decorations: { stars: true, glow: true },
    },
    {
      key: "tech",
      name: "Tech",
      primaryColor: "#0ea5e9",
      secondaryColor: "#111827",
      backgroundGradient: "linear-gradient(135deg, #0f172a, #0ea5e9)",
      decorations: { circuits: true, glow: true },
    },
  ];

  for (const t of themes) {
    await prisma.theme.upsert({
      where: { key: t.key },
      update: t,
      create: t,
    });
  }

  const items = [
    {
      key: "theme-nature",
      name: "Tema Naturaleza",
      description: "Verdes, hojas y un fondo boscoso.",
      category: ShopCategory.THEME,
      pricePoints: 0,
      assetData: { themeKey: "nature" },
      theme: { connect: { key: "nature" } },
    },
    {
      key: "theme-racing",
      name: "Tema Racing",
      description: "Rojo/negro, banderas a cuadros, vibe de pista.",
      category: ShopCategory.THEME,
      pricePoints: 80,
      assetData: { themeKey: "racing" },
      theme: { connect: { key: "racing" } },
    },
    {
      key: "decor-leaves",
      name: "Hojas flotantes",
      description: "Pequeñas hojas animadas en los bordes.",
      category: ShopCategory.DECORATION,
      pricePoints: 40,
      assetData: { component: "LeavesDecoration", themeKey: "nature" },
      theme: { connect: { key: "nature" } },
    },
    {
      key: "decor-flags",
      name: "Banderas Racing",
      description: "Banderas a cuadros en el header.",
      category: ShopCategory.DECORATION,
      pricePoints: 50,
      assetData: { component: "FlagsDecoration", themeKey: "racing" },
      theme: { connect: { key: "racing" } },
    },
  ];

  for (const item of items) {
    await prisma.shopItem.upsert({
      where: { key: item.key },
      update: item,
      create: item,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
