export type Point = readonly [x: number, y: number];
/** Cantos de destino na ordem: topo-esquerda, topo-direita, base-direita, base-esquerda. */
export type Quad = readonly [Point, Point, Point, Point];

// Resolve Ax = b por eliminação de Gauss com pivoteamento parcial.
function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i] ?? 0]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    }
    if (Math.abs(m[pivot]![col]!) < 1e-12) throw new Error("Degenerate quad: points are collinear");
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r]![col]! / m[col]![col]!;
      m[r] = m[r]!.map((v, k) => v - factor * m[col]![k]!);
    }
  }
  return m.map((row, i) => row[n]! / row[i]!);
}

/**
 * matrix3d que leva o retângulo (0,0)-(width,height) aos 4 pontos de `to` (px).
 * Use com `transform-origin: 0 0` no elemento de tamanho width x height.
 */
export function rectToQuadMatrix3d(width: number, height: number, to: Quad): string {
  const from: Quad = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  const rows: number[][] = [];
  const rhs: number[] = [];
  from.forEach(([x, y], i) => {
    const [u, v] = to[i]!;
    rows.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    rhs.push(u);
    rows.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    rhs.push(v);
  });
  const [a, b, c, d, e, f, g, h] = solve(rows, rhs) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const values = [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${values.map((v) => Number(v.toFixed(10))).join(",")})`;
}
