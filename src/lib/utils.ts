export function toggleInArray<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export interface Notice {
  text: string;
  ok: boolean;
}
