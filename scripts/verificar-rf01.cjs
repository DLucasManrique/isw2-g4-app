const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function cargar(archivo, dependencias, fetch) {
  const codigo = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const modulo = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', codigo)(
    (nombre) => {
      assert.ok(nombre in dependencias, `Dependencia no prevista: ${nombre}`);
      return dependencias[nombre];
    }, modulo, modulo.exports, fetch,
  );
  return modulo.exports;
}

async function verificar() {
  const usuario = { id: 1, username: 'admin', nombreCompleto: 'Administrador de la liga', rol: 'ADMIN' };
  let respuesta;
  let falloConexion = false;
  const peticiones = [];
  const fetch = async (url, opciones) => {
    peticiones.push({ url, opciones });
    if (falloConexion) throw new Error('Sin conexión');
    return respuesta;
  };
  const dependencias = { '@/config/api': { API_URL: 'https://liga.example' } };
  const auth = cargar('src/services/authService.ts', dependencias, fetch);
  respuesta = new Response(JSON.stringify({ ...usuario, password: 'no guardar', token: 'no guardar' }));
  assert.deepEqual(await auth.iniciarSesion('admin', 'clave'), usuario);
  assert.equal(peticiones[0].url, 'https://liga.example/api/auth/login');
  assert.equal(peticiones[0].opciones.method, 'POST');
  assert.deepEqual(JSON.parse(peticiones[0].opciones.body), { username: 'admin', password: 'clave' });
  respuesta = new Response('Información privada', { status: 401 });
  await assert.rejects(auth.iniciarSesion('admin', 'incorrecta'), { message: 'Usuario o contraseña incorrectos' });
  respuesta = new Response(JSON.stringify({ detail: 'Datos inválidos', errores: ['Usuario obligatorio'] }), { status: 400 });
  await assert.rejects(auth.iniciarSesion('', ''), /Datos inválidos\nUsuario obligatorio/);
  respuesta = new Response('Error', { status: 500 });
  await assert.rejects(auth.iniciarSesion('admin', 'clave'), /HTTP 500/);
  respuesta = new Response('{}');
  await assert.rejects(auth.iniciarSesion('admin', 'clave'), /sesión inválida/);
  falloConexion = true;
  await assert.rejects(auth.iniciarSesion('admin', 'clave'), /No se pudo conectar/);
  falloConexion = false;
  const sinUrl = cargar('src/services/authService.ts', { '@/config/api': { API_URL: '' } }, fetch);
  await assert.rejects(sinUrl.iniciarSesion('admin', 'clave'), /EXPO_PUBLIC_API_URL/);
  console.log('OK: login, contrato HTTP, 400, 401, 500, conexión y respuesta inválida.');

  const almacenamiento = new Map();
  let fallaEscritura = false;
  const storage = {
    getItem: async (clave) => almacenamiento.get(clave) ?? null,
    setItem: async (clave, valor) => {
      if (fallaEscritura) throw new Error('Sin espacio');
      almacenamiento.set(clave, valor);
    },
    removeItem: async (clave) => {
      if (fallaEscritura) throw new Error('No disponible');
      almacenamiento.delete(clave);
    },
  };
  async function montarSesion() {
    const estados = [];
    const efectos = [];
    let indice = 0;
    const contexto = cargar('src/contexts/SesionContext.tsx', {
      '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
      '@/services/authService': auth,
      react: {
        createContext: () => ({ Provider: 'Provider' }),
        useState: (inicial) => {
          const posicion = indice++;
          if (!(posicion in estados)) estados[posicion] = inicial;
          return [estados[posicion], (valor) => { estados[posicion] = valor; }];
        },
        useEffect: (efecto) => { efectos.push(efecto); },
      },
      'react/jsx-runtime': { jsx: (tipo, props) => props },
    });
    const render = () => {
      indice = 0;
      return contexto.SesionProvider({ children: null }).value;
    };
    render();
    efectos[0]();
    await new Promise(setImmediate);
    return render;
  }
  let render = await montarSesion();
  assert.equal(render().usuario, null);
  assert.equal(render().cargando, false);
  await render().guardarSesion({ ...usuario, password: 'no guardar', token: 'no guardar' });
  assert.deepEqual(JSON.parse(almacenamiento.get('liga.sesion')), usuario);
  render = await montarSesion();
  assert.deepEqual(render().usuario, usuario);
  fallaEscritura = true;
  await assert.rejects(render().cerrarSesion(), /No se pudo cerrar/);
  assert.deepEqual(render().usuario, usuario);
  await assert.rejects(render().guardarSesion(usuario), /No se pudo guardar/);
  fallaEscritura = false;
  await render().cerrarSesion();
  assert.equal(render().usuario, null);
  assert.equal(almacenamiento.size, 0);
  almacenamiento.set('liga.sesion', '{}');
  render = await montarSesion();
  assert.equal(render().usuario, null);
  assert.equal(almacenamiento.size, 0);
  almacenamiento.set('liga.sesion', 'json inválido');
  render = await montarSesion();
  assert.equal(render().usuario, null);
  assert.match(render().error, /No se pudo recuperar/);
  console.log('OK: sesión, restauración, solo cuatro campos, cierre y fallos de almacenamiento.');

  const estadosLogin = [];
  let indiceLogin = 0;
  let llamadasLogin = 0;
  let completarLogin;
  let sesionGuardada;
  const jsx = (tipo, props) => ({ tipo, props });
  const pantalla = cargar('src/screens/LoginScreen.tsx', {
    react: {
      useState: (inicial) => {
        const posicion = indiceLogin++;
        if (!(posicion in estadosLogin)) estadosLogin[posicion] = inicial;
        return [estadosLogin[posicion], (valor) => { estadosLogin[posicion] = valor; }];
      },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
      ActivityIndicator: 'ActivityIndicator', Button: 'Button', KeyboardAvoidingView: 'KeyboardAvoidingView',
      Platform: { OS: 'web' }, ScrollView: 'ScrollView', TextInput: 'TextInput', StyleSheet: { create: (valor) => valor },
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@/components/themed-text': { ThemedText: 'Text' },
    '@/components/themed-view': { ThemedView: 'View' },
    '@/constants/theme': { MaxContentWidth: 800, Spacing: { one: 4, two: 8, three: 16 } },
    '@/hooks/use-theme': { useTheme: () => ({}) },
    '@/contexts/SesionContext': { useSesion: () => ({ guardarSesion: async (valor) => { sesionGuardada = valor; }, error: '' }) },
    '@/services/authService': { iniciarSesion: async (username, password) => {
      llamadasLogin++;
      assert.equal(username, 'admin');
      assert.equal(password, ' clave ');
      return new Promise((resolve) => { completarLogin = resolve; });
    } },
  });
  function controlesLogin() {
    indiceLogin = 0;
    const nodos = [];
    function recorrer(nodo) {
      if (!nodo || typeof nodo !== 'object') return;
      nodos.push(nodo);
      for (const hijo of [nodo.props.children].flat()) recorrer(hijo);
    }
    recorrer(pantalla.default());
    return nodos;
  }
  let controles = controlesLogin();
  controles.find((nodo) => nodo.tipo === 'Button').props.onPress();
  assert.equal(llamadasLogin, 0);
  controles = controlesLogin();
  assert.ok(controles.some((nodo) => nodo.props.children === 'El usuario y la contraseña son obligatorios.'));
  controles.find((nodo) => nodo.props.accessibilityLabel === 'Usuario').props.onChangeText(' admin ');
  const campoPassword = controles.find((nodo) => nodo.props.accessibilityLabel === 'Contraseña');
  assert.equal(campoPassword.props.secureTextEntry, true);
  campoPassword.props.onChangeText(' clave ');
  controlesLogin().find((nodo) => nodo.tipo === 'Button').props.onPress();
  assert.equal(llamadasLogin, 1);
  assert.equal(controlesLogin().find((nodo) => nodo.tipo === 'Button').props.disabled, true);
  completarLogin(usuario);
  await new Promise(setImmediate);
  assert.deepEqual(sesionGuardada, usuario);
  assert.equal(controlesLogin().find((nodo) => nodo.props.accessibilityLabel === 'Contraseña').props.value, '');
  console.log('OK: pantalla, validación sin petición, contraseña oculta, carga y login correcto.');

  const equipos = cargar('src/services/equiposService.ts', dependencias, fetch);
  const equipo = { id: 1, torneoId: 1, nombre: 'Equipo', barrio: null, activo: true };
  const datos = { torneoId: 1, nombre: 'Equipo', barrio: null };
  respuesta = new Response(JSON.stringify([equipo]));
  assert.deepEqual(await equipos.listarEquipos(), [equipo]);
  respuesta = new Response(JSON.stringify(equipo));
  assert.deepEqual(await equipos.obtenerEquipo(1), equipo);
  respuesta = new Response(JSON.stringify(equipo));
  assert.deepEqual(await equipos.crearEquipo(datos), equipo);
  assert.equal(peticiones.at(-1).opciones.method, 'POST');
  respuesta = new Response(JSON.stringify(equipo));
  assert.deepEqual(await equipos.actualizarEquipo(1, datos), equipo);
  assert.equal(peticiones.at(-1).opciones.method, 'PUT');
  respuesta = new Response(null, { status: 204 });
  await equipos.darDeBajaEquipo(1);
  assert.equal(peticiones.at(-1).opciones.method, 'DELETE');
  assert.equal(peticiones.at(-1).url, 'https://liga.example/api/equipos/1');
  console.log('OK: RF-03 listar, consultar, crear, editar y dar de baja con HTTP simulado.');
}

verificar().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
