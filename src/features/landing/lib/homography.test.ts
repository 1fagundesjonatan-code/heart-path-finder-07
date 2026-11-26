import { describe, expect, it } from "vitest";
import { rectToQuadMatrix3d } from "./homography";

function parse(matrix: string): number[] {
  return matrix
    .replace(/^matrix3d\(|\)$/g, "")
    .split(",")
    .map(Number);
}

describe("rectToQuadMatrix3d", () => {
  it("returns identity when the quad equals the rect", () => {
    const m = parse(
      rectToQuadMatrix3d(390, 844, [
        [0, 0],
        [390, 0],
        [390, 844],
        [0, 844],
      ]),
    );
    expect(m).toEqual(
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1].map((v) => expect.closeTo(v, 9)),
    );
  });

  it("scales and translates when the quad is a bigger offset rect", () => {
    const m = parse(
      rectToQuadMatrix3d(100, 200, [
        [10, 20],
        [210, 20],
        [210, 620],
        [10, 620],
      ]),
    );
    expect(m).toEqual(
      [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 10, 20, 0, 1].map((v) => expect.closeTo(v, 9)),
    );
  });

  it("maps every corner onto a perspective quad", () => {
    const to = [
      [11, 9],
      [89, 1],
      [86, 97],
      [3, 98],
    ] as const;
    const m = parse(rectToQuadMatrix3d(390, 844, to));
    const project = (x: number, y: number) => {
      const w = m[3]! * x + m[7]! * y + m[15]!;
      return [(m[0]! * x + m[4]! * y + m[12]!) / w, (m[1]! * x + m[5]! * y + m[13]!) / w];
    };
    const corners = [project(0, 0), project(390, 0), project(390, 844), project(0, 844)];
    corners.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(to[i]![0], 4);
      expect(y).toBeCloseTo(to[i]![1], 4);
    });
  });

  it("throws on a degenerate quad", () => {
    expect(() =>
      rectToQuadMatrix3d(10, 10, [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ]),
    ).toThrow(/Degenerate/);
  });
});
