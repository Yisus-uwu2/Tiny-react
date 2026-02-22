/**
 * MiniGraficoLinea — Gráfico sparkline compacto (SVG).
 * Muestra una tendencia mini sin ejes ni etiquetas.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Line } from 'react-native-svg';

interface PropsMiniGrafico {
  datos: number[];
  color: string;
  ancho?: number;
  alto?: number;
  mostrarPuntos?: boolean;
}

export const MiniGraficoLinea: React.FC<PropsMiniGrafico> = ({
  datos,
  color,
  ancho = 160,
  alto = 60,
  mostrarPuntos = false,
}) => {
  if (!datos || datos.length < 2) return <View style={{ width: ancho, height: alto }} />;

  const margenH = 6;
  const margenV = 8;
  const anchoGrafico = ancho - margenH * 2;
  const altoGrafico = alto - margenV * 2;

  const minimo = Math.min(...datos);
  const maximo = Math.max(...datos);
  const rango = maximo - minimo || 1;

  const puntos = datos.map((val, i) => {
    const x = margenH + (i / (datos.length - 1)) * anchoGrafico;
    const y = margenV + altoGrafico - ((val - minimo) / rango) * altoGrafico;
    return `${x},${y}`;
  });

  const ultimoPunto = puntos[puntos.length - 1].split(',');
  const ultimoX = parseFloat(ultimoPunto[0]);
  const ultimoY = parseFloat(ultimoPunto[1]);

  return (
    <View style={{ width: ancho, height: alto }}>
      <Svg width={ancho} height={alto}>
        {/* Línea base */}
        <Line
          x1={margenH}
          y1={margenV + altoGrafico}
          x2={margenH + anchoGrafico}
          y2={margenV + altoGrafico}
          stroke={color}
          strokeWidth={0.5}
          strokeOpacity={0.2}
        />
        {/* Línea principal */}
        <Polyline
          points={puntos.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Punto final */}
        {mostrarPuntos && (
          <Svg x={ultimoX - 5} y={ultimoY - 5} width={10} height={10}>
            <Svg viewBox="0 0 10 10" width={10} height={10}>
              <Line x1={5} y1={5} x2={5} y2={5} stroke={color} strokeWidth={8} strokeLinecap="round" />
            </Svg>
          </Svg>
        )}
      </Svg>
    </View>
  );
};
