document.addEventListener('DOMContentLoaded', () => {
    const tabla = document.getElementById('tabla-personajes');
    const inputBuscador = document.getElementById('buscador');
    const btnBuscar = document.getElementById('btn-buscar');
    const contenedorBusqueda = inputBuscador.parentElement;

    let listaPersonajesGlobal = [];
    let categoriaActual = 'TODOS';

    // 1. Botones de filtro por categoría
    const divFiltros = document.createElement('div');
    divFiltros.style.cssText = "display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;";
    divFiltros.innerHTML = `
        <button class="btn-filtro activo" data-api="TODOS" style="background:#00ff66; color:#000; border:none; padding:6px 12px; font-weight:bold; cursor:pointer; font-family:inherit;">TODOS</button>
        <button class="btn-filtro" data-api="POKEMON" style="background:#111; color:#00ff66; border:1px solid #00ff66; padding:6px 12px; font-weight:bold; cursor:pointer; font-family:inherit;">POKÉMON</button>
        <button class="btn-filtro" data-api="RICK" style="background:#111; color:#00ff66; border:1px solid #00ff66; padding:6px 12px; font-weight:bold; cursor:pointer; font-family:inherit;">RICK & MORTY</button>
        <button class="btn-filtro" data-api="JUEGO" style="background:#111; color:#00ff66; border:1px solid #00ff66; padding:6px 12px; font-weight:bold; cursor:pointer; font-family:inherit;">VIDEOJUEGOS</button>
    `;
    contenedorBusqueda.insertBefore(divFiltros, inputBuscador);

    // 2. Actualización dinámica del título según la API seleccionada
    function actualizarTitulo(tipo) {
        const elementosH2 = document.querySelectorAll('h2, h1, .titulo');
        for (let el of elementosH2) {
            if (el.innerText.includes('GAME SEARCH') || el.innerText.includes('DATABASE') || el.innerText.includes('DIMENSION') || el.innerText.includes('ARCADE') || el.innerText.includes('MULTIVERSE')) {
                if (tipo === 'POKEMON') el.innerText = "POKÉMON DATABASE";
                else if (tipo === 'RICK') el.innerText = "RICK & MORTY DIMENSION";
                else if (tipo === 'JUEGO') el.innerText = "ARCADE VIDEO GAMES";
                else el.innerText = "GAME SEARCH";
                break;
            }
        }
    }

    async function cargarMultiversoCompleto() {
        try {
            tabla.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#00ffff;">[ CARGANDO BASE DE DATOS COMPLETA... ]</td></tr>';

            // 1. PokeAPI Completa (Cargamos los 1025 Pokémon oficiales existentes)
            const resPoke = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0');
            const dataPoke = await resPoke.json();
            const listaPokemones = dataPoke.results.map((p) => {
                // Extraemos el ID real desde el URL de la API para asegurar la imagen exacta
                const urlPartes = p.url.split('/').filter(Boolean);
                const id = urlPartes[urlPartes.length - 1];
                return {
                    tipo: 'POKEMON',
                    nombre: p.name.toUpperCase(),
                    alias: p.name.toLowerCase(),
                    imagen: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
                    descripcion: `Pokédex Nacional | Pokémon Oficial N° ${id}`
                };
            });

            // 2. Rick and Morty API (Descarga masiva de páginas de personajes)
            let listaRM = [];
            for (let pagina = 1; pagina <= 5; pagina++) {
                const resRM = await fetch(`https://rickandmortyapi.com/api/character/?page=${pagina}`);
                const dataRM = await resRM.json();
                const mapeados = dataRM.results.map(c => ({
                    tipo: 'RICK',
                    nombre: c.name.toUpperCase(),
                    alias: c.name.toLowerCase(),
                    imagen: c.image,
                    descripcion: `Rick & Morty | Estado: ${c.status} - Especie: ${c.species}`
                }));
                listaRM = [...listaRM, ...mapeados];
            }

            // 3. FreeToGame API (Todos los juegos del catálogo)
            const resJuegos = await fetch('https://www.freetogame.com/api/games');
            const dataJuegos = await resJuegos.json();
            const listaJuegos = dataJuegos.map(j => ({
                tipo: 'JUEGO',
                nombre: j.title.toUpperCase(),
                alias: j.title.toLowerCase(),
                imagen: j.thumbnail,
                descripcion: `Videojuego | Género: ${j.genre} | Plataforma: ${j.platform}`
            }));

            // Consolidación de todas las fuentes
            listaPersonajesGlobal = [
                ...listaPokemones,
                ...listaRM,
                ...listaJuegos
            ];

            filtrarYBuscar();
            console.log("¡Multiverso completo cargado! Total de registros:", listaPersonajesGlobal.length);

        } catch (error) {
            console.error("Error al cargar las APIs:", error);
            tabla.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ff007f;">[ ERROR DE CONEXIÓN CON LAS APIS ]</td></tr>';
        }
    }

    function renderizarTabla(lista) {
        tabla.innerHTML = '';

        if (!lista || lista.length === 0) {
            tabla.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#ff007f;">[ NO CHARACTER FOUND ]</td></tr>';
            return;
        }

        // Renderizado fluido de los primeros 60 resultados de la búsqueda o categoría
        lista.slice(0, 60).forEach(item => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td style="text-align: center;">
                    <img src="${item.imagen}" alt="${item.nombre}" class="img-personaje" style="width: 50px; height: 50px; object-fit: contain;" onerror="this.src='https://via.placeholder.com/80?text=ARCADE'">
                </td>
                <td style="color:#00ff66; font-weight:bold; font-size:16px;">${item.nombre}</td>
                <td style="color:#ffffff;">${item.descripcion}</td>
            `;
            tabla.appendChild(fila);
        });
    }

    function filtrarYBuscar() {
        const texto = inputBuscador.value.trim().toLowerCase();
        let filtrados = listaPersonajesGlobal.slice();

        // Filtro por categoría seleccionada
        if (categoriaActual !== 'TODOS') {
            filtrados = filtrados.filter(p => p.tipo === categoriaActual);
        }

        // Filtro por búsqueda textual
        if (texto !== '') {
            filtrados = filtrados.filter(p => 
                p.nombre.toLowerCase().includes(texto) || p.alias.toLowerCase().includes(texto)
            );
        }

        renderizarTabla(filtrados);
    }

    // Eventos para los botones de las APIs
    divFiltros.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('.btn-filtro').forEach(btn => {
                btn.style.background = '#111';
                btn.style.color = '#00ff66';
            });
            e.target.style.background = '#00ff66';
            e.target.style.color = '#000';

            categoriaActual = e.target.getAttribute('data-api');
            actualizarTitulo(categoriaActual);

            inputBuscador.value = ''; // Limpiar el input para ver todos los elementos de la categoría elegida
            filtrarYBuscar();
        }
    });

    // Inicialización y Listeners
    cargarMultiversoCompleto();
    inputBuscador.addEventListener('input', filtrarYBuscar);
    btnBuscar.addEventListener('click', filtrarYBuscar);
});