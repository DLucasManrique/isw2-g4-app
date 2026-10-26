import { Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppButton as Button } from '@/components/app-button';

import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getTorneos } from '@/services/catalogoService';
import { obtenerPosiciones } from '@/services/posicionesService';
import type { Posicion } from '@/types/posicion';

type Torneo = {
  id: number;
  nombre: string;
};

export default function PosicionesScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [torneoId, setTorneoId] = useState<number | null>(null);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoTabla, setCargandoTabla] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargarTorneos() {
      try {
        const datos = await getTorneos();

        if (!Array.isArray(datos)) {
          throw new Error('No se pudo obtener la lista de torneos');
        }

        if (activo) {
          setTorneos(datos);

          if (datos.length > 0) {
            setTorneoId(datos[0].id);
          }
        }
      } catch {
        if (activo) {
          setError('No se pudieron cargar los torneos');
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarTorneos();

    return () => {
      activo = false;
    };
  }, []);

useEffect(() => {
  if (torneoId === null) return;

  const idSeleccionado: number = torneoId;
  let activo = true;
    async function cargarPosiciones() {
      setCargandoTabla(true);
      setError('');

      try {
        const datos = await obtenerPosiciones(idSeleccionado);

        if (activo) {
          setPosiciones(datos);
        }
      } catch {
        if (activo) {
          setError('No se pudo cargar la tabla de posiciones');
          setPosiciones([]);
        }
      } finally {
        if (activo) {
          setCargandoTabla(false);
        }
      }
    }

    cargarPosiciones();

    return () => {
      activo = false;
    };
  }, [torneoId]);

  function fila(valores: (string | number)[], encabezado = false) {
    return (
      <View style={styles.fila}>
        {valores.map((valor, indice) => (
          <ThemedText
            key={indice}
            style={[
              styles.celda,
              encabezado && { backgroundColor: theme.backgroundSelected, color: theme.primary },
              indice === 1 && styles.nombre,
              encabezado && styles.encabezado,
            ]}
          >
            {valor}
          </ThemedText>
        ))}
      </View>
    );
  }

  return (
    <ThemedView style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <ThemedText type="title">
          Tabla de posiciones
        </ThemedText>

        <ThemedText>Seleccioná un torneo:</ThemedText>

        {cargando ? (
          <ActivityIndicator />
        ) : torneos.length === 0 ? (
          <ThemedText style={[Visual.message, { backgroundColor: theme.backgroundElement }]}>No hay torneos disponibles.</ThemedText>
        ) : (
          <View style={styles.torneos}>
            {torneos.map((torneo) => (
              <Button selected={torneo.id === torneoId}
                key={torneo.id}
                title={
                  torneo.id === torneoId
                    ? `✓ ${torneo.nombre}`
                    : torneo.nombre
                }
                onPress={() => setTorneoId(torneo.id)}
              />
            ))}
          </View>
        )}

        {!!error && (
          <ThemedText accessibilityRole="alert">
            {error}
          </ThemedText>
        )}

        {cargandoTabla ? (
          <ActivityIndicator />
        ) : torneoId !== null && !error ? (
          posiciones.length === 0 ? (
            <ThemedText>
              Todavía no hay equipos para mostrar.
            </ThemedText>
          ) : (
            <ScrollView horizontal>
              <View>
                {fila(
                  [
                    'POS', 'EQUIPO', 'PJ', 'PG', 'PE',
                    'PP', 'GF', 'GC', 'DG', 'PTS',
                  ],
                  true
                )}

                {posiciones.map((equipo) => (
                  <View key={equipo.equipoId}>
                    {fila([
                      equipo.posicion,
                      equipo.equipo,
                      equipo.partidosJugados,
                      equipo.ganados,
                      equipo.empatados,
                      equipo.perdidos,
                      equipo.golesFavor,
                      equipo.golesContra,
                      equipo.diferenciaGol,
                      equipo.puntos,
                    ])}
                  </View>
                ))}
              </View>
            </ScrollView>
          )
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: theme.background,
    },
    contenido: {
      ...Visual.content,
      backgroundColor: theme.background,
    },
    torneos: {
      gap: 10,
    },
    fila: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingVertical: 12,
    },
    celda: {
      width: 55,
      textAlign: 'center',
    },
    nombre: {
      width: 160,
      textAlign: 'left',
    },
    encabezado: {
      fontWeight: 'bold',
    },
  });
