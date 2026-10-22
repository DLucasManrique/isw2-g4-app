const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function cargar(archivo, dependencias, fetch) {
  const codigo = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const modulo = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', codigo)((nombre) => {
    assert.ok(nombre in dependencias, `Dependencia no prevista: ${nombre}`);
    return dependencias[nombre];
  }, modulo, modulo.exports, fetch);
  return modulo.exports;
}

const esperar = async () => {
  for (let i = 0; i < 12; i++) await new Promise(setImmediate);
};

function entorno(estado = 'EN_JUEGO') {
  let partido = {
    id: 1, torneoId: 1, numeroFecha: 1, equipoLocalId: 10, equipoVisitanteId: 20,
    canchaId: 1, arbitroId: 1, fechaHoraInicio: '2026-10-19T20:00:00', estado,
  };
  let eventos = [{ id: 1, jugadorId: 12, tipo: 'GOL', minuto: 35 }];
  const jugadores = [
    { id: 12, equipoId: 10, nombre: 'Ana', apellido: 'Pérez', activo: true, numeroCamiseta: 9 },
    { id: 22, equipoId: 20, nombre: 'Luis', apellido: 'Díaz', activo: true, numeroCamiseta: 5 },
  ];
  const peticiones = [];
  let fallo = null;
  let fallarRecarga = false;
  const fetch = async (url, opciones = {}) => {
    const metodo = opciones.method ?? 'GET';
    peticiones.push({ url, metodo, cuerpo: opciones.body ? JSON.parse(opciones.body) : null });
    if (fallo === 'conexion') throw new Error('Sin conexión');
    if (typeof fallo === 'number') return new Response(JSON.stringify({ detail: `Error de prueba ${fallo}`, errores: ['Dato inválido'] }), { status: fallo });
    if (fallarRecarga && metodo === 'GET') throw new Error('Falló recarga');
    if (url.endsWith('/estado')) {
      partido = { ...partido, ...JSON.parse(opciones.body) };
      return Response.json(partido);
    }
    if (/\/eventos\/\d+$/.test(url)) {
      const id = Number(url.split('/').at(-1));
      if (metodo === 'DELETE') {
        eventos = eventos.filter((evento) => evento.id !== id);
        return { ok: true, status: 204, json: () => { throw new Error('No se debe leer JSON en DELETE'); } };
      }
      const datos = { id, ...JSON.parse(opciones.body) };
      eventos = eventos.map((evento) => evento.id === id ? datos : evento);
      return Response.json(datos);
    }
    if (url.endsWith('/eventos')) {
      if (metodo === 'POST') {
        const datos = { id: Math.max(0, ...eventos.map((evento) => evento.id)) + 1, ...JSON.parse(opciones.body) };
        eventos.push(datos);
        return Response.json(datos, { status: 201 });
      }
      return Response.json(eventos);
    }
    if (url.includes('/api/jugadores?equipoId=')) {
      return Response.json(jugadores.filter((jugador) => jugador.equipoId === Number(url.split('=').at(-1))));
    }
    if (url.includes('/api/equipos/')) {
      const id = Number(url.split('/').at(-1));
      return Response.json({ id, nombre: id === 10 ? 'Local FC' : 'Visitante FC' });
    }
    assert.equal(url, 'https://liga.example/api/partidos/1');
    return Response.json(partido);
  };
  const api = { '@/config/api': { API_URL: 'https://liga.example' } };
  const partidos = cargar('src/services/partidosService.ts', api, fetch);
  const eventosService = cargar('src/services/eventosPartidoService.ts', { '@/services/partidosService': partidos }, fetch);
  const jugadoresService = cargar('src/services/jugadoresService.ts', api, fetch);
  const equiposService = cargar('src/services/equiposService.ts', api, fetch);
  return {
    peticiones, partidos, eventosService, jugadoresService, equiposService,
    fallo: (valor) => { fallo = valor; },
    fallarRecarga: () => { fallarRecarga = true; },
  };
}

function montar(env, id = '1') {
  const estados = [];
  let indice = 0;
  let focoPendiente;
  const iguales = (a, b) => a && b && a.length === b.length && a.every((valor, i) => Object.is(valor, b[i]));
  const jsx = (tipo, props) => ({ tipo, props });
  const pantalla = cargar('src/screens/partidos/PartidoEnVivoScreen.tsx', {
    react: {
      useState: (inicial) => {
        const posicion = indice++;
        if (!(posicion in estados)) estados[posicion] = inicial;
        return [estados[posicion], (valor) => { estados[posicion] = valor; }];
      },
      useRef: (inicial) => {
        const posicion = indice++;
        if (!(posicion in estados)) estados[posicion] = { current: inicial };
        return estados[posicion];
      },
      useCallback: (funcion, deps) => {
        const posicion = indice++;
        if (!iguales(estados[posicion]?.deps, deps)) estados[posicion] = { funcion, deps };
        return estados[posicion].funcion;
      },
    },
    'expo-router': {
      useLocalSearchParams: () => ({ id }),
      useFocusEffect: (funcion) => {
        const posicion = indice++;
        if (estados[posicion] !== funcion) {
          estados[posicion] = funcion;
          focoPendiente = funcion;
        }
      },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': {
      ActivityIndicator: 'ActivityIndicator', Button: 'Button', KeyboardAvoidingView: 'KeyboardAvoidingView',
      Platform: { OS: 'web' }, ScrollView: 'ScrollView', TextInput: 'TextInput', StyleSheet: { create: (valor) => valor },
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@/components/themed-text': { ThemedText: 'Text' },
    '@/components/themed-view': { ThemedView: 'View' },
    '@/constants/theme': { MaxContentWidth: 800, Spacing: { one: 4, two: 8, three: 16 } },
    '@/hooks/use-theme': { useTheme: () => ({}) },
    '@/services/partidosService': env.partidos,
    '@/services/eventosPartidoService': env.eventosService,
    '@/services/jugadoresService': env.jugadoresService,
    '@/services/equiposService': env.equiposService,
  });
  function render() {
    indice = 0;
    const nodos = [];
    function recorrer(nodo) {
      if (Array.isArray(nodo)) return nodo.forEach(recorrer);
      if (!nodo || typeof nodo !== 'object') return;
      nodos.push(nodo);
      recorrer(nodo.props.children);
    }
    recorrer(pantalla.default());
    if (focoPendiente) {
      const efecto = focoPendiente;
      focoPendiente = null;
      efecto();
    }
    return nodos;
  }
  const boton = (titulo) => render().find((nodo) => nodo.tipo === 'Button' && nodo.props.title === titulo);
  const pulsar = (titulo) => {
    const nodo = boton(titulo);
    assert.ok(nodo, `Botón inexistente: ${titulo}`);
    assert.ok(!nodo.props.disabled, `Botón deshabilitado: ${titulo}`);
    nodo.props.onPress();
  };
  const texto = () => render().filter((nodo) => nodo.tipo === 'Text').map((nodo) => [nodo.props.children].flat().join('')).join('\n');
  const minuto = (valor) => render().find((nodo) => nodo.tipo === 'TextInput').props.onChangeText(valor);
  const seleccionar = () => { pulsar('Seleccionar jugador'); pulsar('Ana Pérez — Local FC'); };
  render();
  return { render, boton, pulsar, texto, minuto, seleccionar };
}

async function verificar() {
  for (const estado of ['PROGRAMADO', 'EN_JUEGO', 'FINALIZADO', 'SUSPENDIDO']) {
    const env = entorno(estado);
    const ui = montar(env);
    assert.ok(ui.render().some((nodo) => nodo.props.accessibilityLabel === 'Cargando partido'));
    await esperar();
    assert.match(ui.texto(), /Local FC vs. Visitante FC/);
    assert.match(ui.texto(), /2026-10-19 20:00:00/);
    assert.match(ui.texto(), /Ana Pérez — Local FC/);
    assert.equal(!!ui.boton('Iniciar partido'), estado === 'PROGRAMADO');
    assert.equal(!!ui.boton('Finalizar'), estado === 'EN_JUEGO');
    assert.equal(!!ui.boton('Suspender'), estado === 'PROGRAMADO' || estado === 'EN_JUEGO');
    assert.equal(!!ui.boton('Registrar evento'), estado === 'EN_JUEGO');
    assert.equal(!!ui.boton('Corregir evento 1'), estado === 'EN_JUEGO');
    assert.equal(!!ui.boton('Eliminar evento 1'), estado === 'EN_JUEGO');
    if (estado === 'PROGRAMADO') {
      ui.pulsar('Iniciar partido');
      await esperar();
      assert.ok(ui.boton('Finalizar'));
      assert.deepEqual(env.peticiones.find((peticion) => peticion.metodo === 'PATCH').cuerpo, { estado: 'EN_JUEGO' });
    }
    if (estado === 'EN_JUEGO') {
      ui.pulsar('Finalizar');
      assert.equal(env.peticiones.filter((peticion) => peticion.metodo === 'PATCH').length, 0);
      ui.pulsar('Cancelar');
      ui.pulsar('Finalizar');
      ui.pulsar('Confirmar');
      await esperar();
      assert.ok(!ui.boton('Registrar evento'));
      assert.match(ui.texto(), /FINALIZADO/);
    }
  }
  for (const estado of ['PROGRAMADO', 'EN_JUEGO']) {
    const ui = montar(entorno(estado));
    await esperar();
    ui.pulsar('Suspender');
    ui.pulsar('Confirmar');
    await esperar();
    assert.match(ui.texto(), /SUSPENDIDO/);
    assert.ok(!ui.boton('Suspender'));
  }
  console.log('OK: render, estados, transiciones, confirmaciones y estados terminales.');

  for (const tipo of ['GOL', 'AMARILLA', 'ROJA']) {
    const env = entorno();
    const ui = montar(env);
    await esperar();
    ui.pulsar('Registrar evento');
    assert.match(ui.texto(), /Selecciona un jugador/);
    ui.seleccionar();
    ui.pulsar('Registrar evento');
    assert.match(ui.texto(), /Selecciona el tipo/);
    ui.pulsar(tipo);
    for (const minuto of ['0', '121', '', '1.5', 'texto']) {
      ui.minuto(minuto);
      ui.pulsar('Registrar evento');
      assert.match(ui.texto(), /El minuto debe ser un entero/);
    }
    assert.equal(env.peticiones.filter((peticion) => peticion.metodo === 'POST').length, 0);
    for (const minuto of ['1', '120']) {
      if (minuto === '120') { ui.seleccionar(); ui.pulsar(tipo); }
      ui.minuto(minuto);
      const boton = ui.boton('Registrar evento');
      boton.props.onPress();
      boton.props.onPress();
      assert.ok(ui.boton('Registrar evento').props.disabled);
      await esperar();
      assert.match(ui.texto(), /Evento registrado/);
      assert.match(ui.texto(), new RegExp(`${minuto}′ — ${tipo}`));
    }
    const posts = env.peticiones.filter((peticion) => peticion.metodo === 'POST');
    assert.equal(posts.length, 2);
    assert.equal(posts[0].url, 'https://liga.example/api/partidos/1/eventos');
    assert.deepEqual(posts[1].cuerpo, { jugadorId: 12, tipo, minuto: 120 });
  }
  console.log('OK: GOL, AMARILLA, ROJA, minutos válidos e inválidos y prevención de doble envío.');

  const env = entorno();
  const ui = montar(env);
  await esperar();
  ui.pulsar('Corregir evento 1');
  assert.equal(ui.render().find((nodo) => nodo.tipo === 'TextInput').props.value, '35');
  ui.pulsar('Cancelar edición');
  assert.ok(ui.boton('Registrar evento'));
  assert.equal(env.peticiones.filter((peticion) => peticion.metodo === 'PUT').length, 0);
  ui.pulsar('Corregir evento 1');
  ui.pulsar('Seleccionar jugador');
  ui.pulsar('Luis Díaz — Visitante FC');
  ui.pulsar('AMARILLA');
  ui.minuto('40');
  ui.pulsar('Guardar corrección');
  await esperar();
  assert.match(ui.texto(), /40′ — AMARILLA/);
  assert.match(ui.texto(), /Luis Díaz — Visitante FC/);
  const put = env.peticiones.find((peticion) => peticion.metodo === 'PUT');
  assert.equal(put.url, 'https://liga.example/api/partidos/1/eventos/1');
  assert.deepEqual(put.cuerpo, { jugadorId: 22, tipo: 'AMARILLA', minuto: 40 });
  ui.pulsar('Eliminar evento 1');
  assert.equal(env.peticiones.filter((peticion) => peticion.metodo === 'DELETE').length, 0);
  ui.pulsar('Cancelar');
  ui.pulsar('Eliminar evento 1');
  ui.pulsar('Confirmar');
  await esperar();
  assert.match(ui.texto(), /No hay eventos registrados/);
  assert.equal(env.peticiones.find((peticion) => peticion.metodo === 'DELETE').url, 'https://liga.example/api/partidos/1/eventos/1');
  console.log('OK: corregir jugador/tipo/minuto, cancelar edición y eliminar con confirmación y DELETE 204.');

  for (const fallo of [400, 404, 409, 500, 'conexion']) {
    const env = entorno();
    env.fallo(fallo);
    const ui = montar(env);
    await esperar();
    assert.match(ui.texto(), fallo === 'conexion' ? /No se pudo conectar/ : new RegExp(`Error de prueba ${fallo}`));
    env.fallo(null);
    ui.pulsar('Reintentar / Actualizar');
    await esperar();
    assert.ok(ui.boton('Registrar evento'));
    env.fallo(fallo);
    ui.pulsar('Corregir evento 1');
    ui.pulsar('Guardar corrección');
    await esperar();
    assert.ok(ui.boton('Guardar corrección').props.disabled);
    assert.match(ui.texto(), /Actualiza los datos antes de volver a operar/);
    env.fallo(null);
    ui.pulsar('Reintentar / Actualizar');
    await esperar();
    assert.ok(!ui.boton('Registrar evento').props.disabled);
  }
  const recarga = entorno();
  const pantalla = montar(recarga);
  await esperar();
  pantalla.seleccionar();
  pantalla.pulsar('GOL');
  pantalla.minuto('10');
  recarga.fallarRecarga();
  pantalla.pulsar('Registrar evento');
  await esperar();
  assert.match(pantalla.texto(), /La operación se realizó, pero no se pudieron actualizar/);
  assert.ok(pantalla.boton('Registrar evento').props.disabled);
  assert.equal(recarga.peticiones.filter((peticion) => peticion.metodo === 'POST').length, 1);
  console.log('OK: HTTP 400/404/409/500, conexión, reintento y recarga fallida sin repetir mutaciones.');

  const invalido = entorno();
  const ruta = montar(invalido, 'abc');
  await esperar();
  assert.match(ruta.texto(), /ID del partido/);
  assert.equal(invalido.peticiones.length, 0);
  const sinUrl = cargar('src/services/partidosService.ts', { '@/config/api': { API_URL: '' } });
  await assert.rejects(sinUrl.obtenerPartido(1), /EXPO_PUBLIC_API_URL/);
  console.log('OK: ID inválido sin petición y configuración de API obligatoria.');
}

verificar().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
