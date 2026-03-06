// Mock for next/headers used in tests
export function cookies() {
  return {
    get: (_name: string) => undefined,
    set: (_name: string, _value: string) => {},
    delete: (_name: string) => {},
  };
}
