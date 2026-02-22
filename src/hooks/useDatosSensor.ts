/**
 * Hook personalizado: useDatosSensor
 * Genera datos simulados de sensores neonatales con historial.
 * Actualiza cada 3 segundos con fluctuaciones realistas.
 */
import { useState, useEffect, useRef } from 'react';

// ── Interfaces ──────────────────────────────────────────────────

export interface DatosSensor {
  ritmoCardiaco: number;
  oxigeno: number;
  temperatura: number;
  actividad: 'dormido' | 'tranquilo' | 'activo' | 'llorando';
  conectado: boolean;
  ultimaActualizacion: Date;
  estado: 'normal' | 'precaución' | 'alerta';
}

export interface PuntoHistorial {
  hora: string;
  ritmoCardiaco: number;
  oxigeno: number;
  temperatura: number;
}

// ── Utilidades privadas ─────────────────────────────────────────

const aleatorioEnRango = (min: number, max: number, decimales = 0): number => {
  const valor = Math.random() * (max - min) + min;
  return decimales > 0 ? parseFloat(valor.toFixed(decimales)) : Math.round(valor);
};

const fluctuar = (valor: number, cantidad: number, min: number, max: number, decimales = 0): number => {
  const delta = (Math.random() - 0.5) * 2 * cantidad;
  const nuevo = Math.max(min, Math.min(max, valor + delta));
  return decimales > 0 ? parseFloat(nuevo.toFixed(decimales)) : Math.round(nuevo);
};

const obtenerActividad = (rc: number): DatosSensor['actividad'] => {
  if (rc < 125) return 'dormido';
  if (rc < 135) return 'tranquilo';
  if (rc < 150) return 'activo';
  return 'llorando';
};

const obtenerEstado = (rc: number, o2: number, temp: number): DatosSensor['estado'] => {
  if (rc < 100 || rc > 180 || o2 < 93 || temp > 38.0 || temp < 35.5) return 'alerta';
  if (rc < 110 || rc > 170 || o2 < 95 || temp > 37.8 || temp < 36.0) return 'precaución';
  return 'normal';
};

const generarHistorial = (): PuntoHistorial[] => {
  const puntos: PuntoHistorial[] = [];
  const ahora = new Date();
  let rc = 135;
  let o2 = 98;
  let temp = 36.8;

  for (let i = 23; i >= 0; i--) {
    const t = new Date(ahora.getTime() - i * 30 * 60_000);
    rc = fluctuar(rc, 8, 110, 170);
    o2 = fluctuar(o2, 1.5, 94, 100, 1);
    temp = fluctuar(temp, 0.2, 36.0, 37.8, 1);
    puntos.push({
      hora: `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`,
      ritmoCardiaco: rc,
      oxigeno: o2,
      temperatura: temp,
    });
  }
  return puntos;
};

// ── Hook principal ──────────────────────────────────────────────

export const useDatosSensor = () => {
  const [datos, setDatos] = useState<DatosSensor>({
    ritmoCardiaco: 138,
    oxigeno: 98,
    temperatura: 36.8,
    actividad: 'tranquilo',
    conectado: true,
    ultimaActualizacion: new Date(),
    estado: 'normal',
  });

  const [historial, setHistorial] = useState<PuntoHistorial[]>(generarHistorial());

  const refRC = useRef(138);
  const refO2 = useRef(98);
  const refTemp = useRef(36.8);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const nuevoRC = fluctuar(refRC.current, 5, 110, 170);
      const nuevoO2 = fluctuar(refO2.current, 0.8, 94, 100, 1);
      const nuevaTemp = fluctuar(refTemp.current, 0.1, 36.0, 37.8, 1);

      refRC.current = nuevoRC;
      refO2.current = nuevoO2;
      refTemp.current = nuevaTemp;

      const ahora = new Date();
      const horaStr = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

      setDatos({
        ritmoCardiaco: nuevoRC,
        oxigeno: nuevoO2,
        temperatura: nuevaTemp,
        actividad: obtenerActividad(nuevoRC),
        conectado: true,
        ultimaActualizacion: ahora,
        estado: obtenerEstado(nuevoRC, nuevoO2, nuevaTemp),
      });

      setHistorial(prev => {
        const actualizado = [
          ...prev,
          { hora: horaStr, ritmoCardiaco: nuevoRC, oxigeno: nuevoO2, temperatura: nuevaTemp },
        ];
        return actualizado.slice(-24);
      });
    }, 3000);

    return () => clearInterval(intervalo);
  }, []);

  return { datos, historial };
};
