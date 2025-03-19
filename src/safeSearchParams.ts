import { createSafeSearchParamsErreur } from "./erreur.ts";
import type {
  TDatatype,
  TDtObjBase,
  TDtObjOutput,
  TDtObjOutputStrict,
  TDtParseOutput,
  TReadonlyURLSearchParams,
  TSafeSearchParams,
} from "./types.ts";

export function safeSearchParams(
  init?:
    | Iterable<string[]>
    | Record<string, string>
    | string
    | URLSearchParams,
): TSafeSearchParams {
  const urlSearchParams: TReadonlyURLSearchParams = new URLSearchParams(init);
  const cache = new Map<string, string[]>();

  return {
    urlSearchParams,
    toString: () => urlSearchParams.toString(),
    get,
    getOrThrow,
    has,
    getObj,
    getObjOrThrow,
    append,
    set,
    delete: del,
    sort,
    setObj,
  };

  function get<Out>(name: string, type: TDatatype<Out>): Out | null {
    const parsed = getInternal(name, type);
    if (parsed.valid) {
      return parsed.value;
    }
    return null;
  }

  function getOrThrow<Out>(name: string, type: TDatatype<Out>): Out {
    const parsed = getInternal(name, type);
    if (!parsed.valid) {
      throw createSafeSearchParamsErreur(
        name,
        type,
        getAllFromCache(name),
        parsed.error,
      );
    }
    return parsed.value;
  }

  function has(name: string, type: TDatatype<any>): boolean {
    const all = getAllFromCache(name);
    if (all.length === 0) {
      return false;
    }
    const parsed = type.parse(all);
    return parsed.valid;
  }

  function getObj<Obj extends TDtObjBase>(obj: Obj): TDtObjOutput<Obj> {
    const output: Record<string, any> = {};
    for (const [name, type] of Object.entries(obj)) {
      const value = get(name, type);
      output[name] = value;
    }
    return output as TDtObjOutput<Obj>;
  }

  function getObjOrThrow<Obj extends TDtObjBase>(
    obj: Obj,
  ): TDtObjOutputStrict<Obj> {
    const output: Record<string, any> = {};
    for (const [name, type] of Object.entries(obj)) {
      const value = getOrThrow(name, type);
      output[name] = value;
    }
    return output as TDtObjOutputStrict<Obj>;
  }

  function append<T>(
    name: string,
    type: TDatatype<T>,
    value: T,
  ): TSafeSearchParams {
    const serialized = type.serialize(value);
    const nextUrlSearchParams = new URLSearchParams(urlSearchParams);
    serialized.forEach((v) => nextUrlSearchParams.append(name, v));
    return safeSearchParams(nextUrlSearchParams);
  }

  function del(name: string): TSafeSearchParams {
    const nextUrlSearchParams = new URLSearchParams(urlSearchParams);
    nextUrlSearchParams.delete(name);
    return safeSearchParams(nextUrlSearchParams);
  }

  function set<T>(
    name: string,
    type: TDatatype<T>,
    value: T,
  ): TSafeSearchParams {
    const serialized = type.serialize(value);
    return setInternal({ [name]: serialized });
  }

  function sort(): TSafeSearchParams {
    const nextUrlSearchParams = new URLSearchParams(urlSearchParams);
    nextUrlSearchParams.sort();
    return safeSearchParams(nextUrlSearchParams);
  }

  function setObj<Obj extends TDtObjBase>(
    obj: Obj,
    values: TDtObjOutput<Obj>,
  ): TSafeSearchParams {
    const nextValues: Record<string, string[]> = {};
    for (const [name, value] of Object.entries(values)) {
      const type = obj[name];
      if (type === undefined) {
        throw new Error(`Type for "${name}" not found in object`);
      }
      const serialized = type.serialize(value);
      nextValues[name] = serialized;
    }
    return setInternal(nextValues);
  }

  // --- INTERNALS ---

  function getAllFromCache(name: string): string[] {
    let all = cache.get(name);
    if (all !== undefined) {
      return all;
    }
    all = urlSearchParams.getAll(name);
    cache.set(name, all);
    return all;
  }

  function getInternal<Out>(
    name: string,
    type: TDatatype<Out>,
  ): TDtParseOutput<Out> {
    const all = getAllFromCache(name);
    const parsed = type.parse(all);
    return parsed;
  }

  function setInternal(values: Record<string, string[]>): TSafeSearchParams {
    const nextUrlSearchParams = new URLSearchParams(urlSearchParams);
    const nextEntries: [string, string][] = [];
    // Clone values
    const queues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, [...value]]),
    );
    for (const [key, value] of nextUrlSearchParams.entries()) {
      const queue = queues[key];
      if (queue === undefined) {
        nextEntries.push([key, value]);
        continue;
      }
      // Name matches
      if (queue.length === 0) {
        continue;
      }
      nextEntries.push([key, queue.shift()!]);
    }
    // Add remaining values
    for (const [key, queue] of Object.entries(queues)) {
      for (const value of queue) {
        nextEntries.push([key, value]);
      }
    }
    return safeSearchParams(nextEntries);
  }
}
