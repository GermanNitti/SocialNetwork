# EXPORTACIÓN DE DATOS DE LA BASE DE DATOS - SOCIAL NETWORK
# Fecha de exportación: 29/01/2026

## RESUMEN DE DATOS
- Total usuarios: 1
- Total posts: 0
- Total comentarios: 0
- Total likes: 0
- Total squads: 0
- Total proyectos: 1
- Total badges: 0
- Total mensajes: 0
- Total amistades: 0

## USUARIOS (CSV)
ID,Nombre,Usuario,Email,Bio,Ubicación,Intereses,Avatar,Onboarding,Puntos,PuntosTotales,Streak,UltimoLogin,CreatedAt,TemaID,Portada
1,"German Ruiz",dios,nittigerman@gmail.com,"","","F1;gaming;tech",,true,0,0,0,,2026-01-29T08:41:29.773Z,,

## PROYECTOS (CSV)
ID,UsuarioID,Titulo,Descripcion,Categoria,FechaObjetivo,Visibilidad,NecesitaAyuda,Progreso
1,1,"J","",OTRO,,PUBLIC,false,0

## ANÁLISIS DE LA SITUACIÓN

### ¿Dónde están los usuarios previos?

Basado en el análisis de la base de datos, **solo existe 1 usuario** en el sistema:

1. **Usuario: German Ruiz** (username: "dios", email: "nittigerman@gmail.com")
   - ID: 1
   - Intereses: F1, gaming, tech  
   - Onboarding completado: true
   - Puntos: 0
   - Creado: 2026-01-29T08:41:29.773Z (hoy mismo)

### Posibles causas de la pérdida de usuarios:

1. **Base de datos reseteada o nueva**: El usuario fue creado hoy mismo, lo que sugiere que la base de datos está vacía desde el inicio del día.

2. **Problema de conexión**: Puede haber habido un problema con la conexión a la base de datos anterior.

3. **Backup no restaurado**: Si existe un backup anterior con más usuarios, no ha sido restaurado.

4. **Base de datos diferente**: Es posible que la aplicación esté conectada a una base de datos diferente a la que tenía los usuarios previos.

### Recomendaciones:

1. **Verificar conexión de base de datos**: Revisar el archivo .env para confirmar que DATABASE_URL apunta a la base de datos correcta.

2. **Buscar backups**: Revisar si existen archivos de backup (.sql, .dump) en el servidor.

3. **Historial de migraciones**: Verificar si corrió alguna migración que haya eliminado datos (DROP/RESET).

4. **Logs del servidor**: Revisar logs por eventos inusuales en la base de datos.

### Si tienes un backup:

Para restaurar los datos, necesitarías:
- Archivo SQL de backup
- Acceso a la base de datos 
- Ejecutar: `psql -d nombre_db < backup.sql`

### Datos actuales disponibles:

Solo puedes recuperar el usuario "German Ruiz" que existe actualmente. Los demás usuarios parecen haber sido eliminados o están en una base de datos diferente.