require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");

// Adaptador PG para Prisma
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function createSampleUsers() {
  const users = [
    {
      name: "Ana García",
      username: "anagarcia",
      email: "ana@ejemplo.com",
      bio: "Desarrolladora web apasionada por el diseño UX",
      location: "Buenos Aires",
      interests: ["tecnología", "diseño", "fotografía"],
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana"
    },
    {
      name: "Carlos Rodríguez",
      username: "carlosr",
      email: "carlos@ejemplo.com", 
      bio: "Entusiasta del fitness y la vida saludable",
      location: "Córdoba",
      interests: ["deporte", "nutrición", "motivación"],
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos"
    },
    {
      name: "María López",
      username: "mlopez",
      email: "maria@ejemplo.com",
      bio: "Artista digital y creadora de contenido",
      location: "Rosario",
      interests: ["arte", "creatividad", "tecnología"],
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria"
    },
    {
      name: "Diego Martínez",
      username: "dmg",
      email: "diego@ejemplo.com",
      bio: "Emprendedor tecnológico y mentor de startups",
      location: "Madrid",
      interests: ["negocios", "tecnología", "innovación"],
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diego"
    },
    {
      name: "Lucía Fernández",
      username: "lucifer",
      email: "lucia@ejemplo.com",
      bio: "Fotógrafa profesional y viajera",
      location: "Barcelona",
      interests: ["fotografía", "viajes", "naturaleza"],
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucia"
    }
  ];

  const createdUsers = [];
  
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: userData,
      create: {
        ...userData,
        password: hashedPassword,
        hasCompletedOnboarding: true
      }
    });
    
    createdUsers.push(user);
    console.log(`✅ Usuario creado: ${user.username}`);
  }
  
  return createdUsers;
}

async function createSamplePosts(users) {
  const posts = [
    {
      content: "¡Justo lancé mi nuevo proyecto web! 🚀 Después de meses de trabajo, finalmente está listo. ¿Qué les parece? #webdev #proyecto",
      hashtags: ["webdev", "proyecto"],
      authorUsername: "anagarcia"
    },
    {
      content: "Nuevos récord personal hoy en el gimnasio 💪 La constancia es la clave del éxito. ¡Nunca se rindan!",
      hashtags: ["fitness", "motivacion"],
      authorUsername: "carlosr"
    },
    {
      content: "Compartiendo mi última ilustración digital. Me encanta experimentar con nuevos estilos y colores 🎨",
      image: "https://picsum.photos/seed/art1/400/300",
      hashtags: ["arte", "digital"],
      authorUsername: "mlopez"
    },
    {
      content: "Consejo del día: No esperes la oportunidad perfecta, créala. El emprendimiento es un viaje de aprendizaje constante 📈",
      hashtags: ["emprendimiento", "consejos"],
      authorUsername: "dmg"
    },
    {
      content: "Atardecer increíble en la costa 🌅 Estos son los momentos que valen la pena capturar. La naturaleza nunca decepciona.",
      image: "https://picsum.photos/seed/sunset1/400/300",
      hashtags: ["fotografia", "naturaleza", "atardecer"],
      authorUsername: "lucifer"
    },
    {
      content: "¿Alguna vez se han sentido estancados creativamente? Yo sí. Así que superé ese bloqueo explorando nuevas técnicas de diseño.",
      hashtags: ["diseno", "creatividad"],
      authorUsername: "anagarcia"
    },
    {
      content: "Rutina de mañana perfecta: 5km de carrera + meditación + café. Así empiezo el día con energía positiva ☕🏃‍♂️",
      hashtags: ["rutina", "bienestar"],
      authorUsername: "carlosr"
    }
  ];

  for (const postData of posts) {
    const author = users.find(u => u.username === postData.authorUsername);
    if (author) {
      const { authorUsername, ...postContent } = postData;
      const post = await prisma.post.create({
        data: {
          ...postContent,
          authorId: author.id
        }
      });
      console.log(`✅ Post creado: ${post.content.substring(0, 30)}...`);
    }
  }
}

async function main() {
  console.log("🌱 Creando usuarios de ejemplo...");
  const users = await createSampleUsers();
  
  console.log("\n📝 Creando posts de ejemplo...");
  await createSamplePosts(users);
  
  console.log("\n🎉 Datos de ejemplo creados exitosamente!");
  console.log("Puedes iniciar sesión con cualquiera de estos usuarios usando la contraseña: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });