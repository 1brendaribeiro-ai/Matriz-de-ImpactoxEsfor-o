import { quadrantAt, QUADRANTS } from '../../domain/quadrants'
import type { Position, QuadrantId } from '../../domain/types'

/** Dimensões fixas do card na matriz (devem coincidir com o CSS). */
export const CARD_W = 184
export const CARD_H = 62
/** Espaço reservado no topo de cada quadrante para o seu cabeçalho. */
export const QUADRANT_HEADER_H = 66
const PAD = 10

export interface Size {
  width: number
  height: number
}

export interface PixelPoint {
  x: number
  y: number
}

/** Converte ponto em pixels (origem no canto superior esquerdo do tabuleiro) em posição normalizada. */
export function pixelToPosition(p: PixelPoint, size: Size): Position {
  return {
    x: Math.min(1, Math.max(0, p.x / size.width)),
    y: Math.min(1, Math.max(0, 1 - p.y / size.height)),
  }
}

export function positionToPixel(pos: Position, size: Size): PixelPoint {
  return { x: pos.x * size.width, y: (1 - pos.y) * size.height }
}

export function quadrantAtPixel(p: PixelPoint, size: Size): QuadrantId {
  return quadrantAt(pixelToPosition(p, size))
}

/** Mantém o centro do card dentro dos limites do quadrante, sem invadir o cabeçalho. */
export function clampCenterToQuadrant(p: PixelPoint, quadrant: QuadrantId, size: Size): PixelPoint {
  const { col, row } = QUADRANTS[quadrant]
  const qw = size.width / 2
  const qh = size.height / 2
  const left = col * qw
  const top = row * qh
  const clamp = (v: number, min: number, max: number) => (min > max ? (min + max) / 2 : Math.min(max, Math.max(min, v)))
  return {
    x: clamp(p.x, left + CARD_W / 2 + PAD, left + qw - CARD_W / 2 - PAD),
    y: clamp(p.y, top + QUADRANT_HEADER_H + CARD_H / 2, top + qh - CARD_H / 2 - PAD),
  }
}

/** Posição de renderização (canto superior esquerdo) de um card já classificado. */
export function cardTopLeft(pos: Position, size: Size): PixelPoint {
  const quadrant = quadrantAt(pos)
  const center = clampCenterToQuadrant(positionToPixel(pos, size), quadrant, size)
  return { x: center.x - CARD_W / 2, y: center.y - CARD_H / 2 }
}
