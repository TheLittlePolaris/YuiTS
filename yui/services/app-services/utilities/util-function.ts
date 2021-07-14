export function RNG(range: number): Promise<number> {
  return new Promise<number>((resolve, _) => {
    resolve(Math.floor(Math.random() * range))
  })
}
