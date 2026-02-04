# LinkedIn Job Hunter

Una aplicación Next.js para buscar y mostrar ofertas de trabajo de LinkedIn en tiempo real.

## Características

- Búsqueda de ofertas de trabajo en LinkedIn
- Tarjetas con información detallada de cada oferta
- Botón para acceder directamente a la oferta
- Interfaz responsiva con Tailwind CSS
- Despliegue fácil en Vercel

## Configuración

1. Clona o descarga el proyecto.

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Obtén una API key de [RapidAPI JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch).

4. Crea un archivo `.env.local` en la raíz del proyecto y agrega tu API key:
   ```
   NEXT_PUBLIC_RAPIDAPI_KEY=tu_api_key_aqui
   ```

5. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue en Vercel

1. Sube tu proyecto a GitHub.

2. Ve a [Vercel](https://vercel.com) y conecta tu repositorio.

3. Agrega la variable de entorno `NEXT_PUBLIC_RAPIDAPI_KEY` en la configuración de Vercel.

4. Despliega el proyecto.

## Tecnologías utilizadas

- Next.js 14
- TypeScript
- Tailwind CSS
- RapidAPI JSearch
