export type TDtParseOutput<T> = { valid: true; value: T } | {
  valid: false;
  error: string;
};

export interface TDatatype<Out> {
  readonly name: string;
  parse: (input: string[]) => TDtParseOutput<Out>;
  serialize: (output: Out) => string[];
}

export type TDtObjBase = Record<string, TDatatype<any>>;

export type TDtObjOutput<Obj extends TDtObjBase> = {
  [K in keyof Obj]: Obj[K] extends TDatatype<infer Out> ? (Out | null)
    : never;
};

export type TDtObjOutputStrict<Obj extends TDtObjBase> = {
  [K in keyof Obj]: Obj[K] extends TDatatype<infer Out> ? (Out) : never;
};

export type TReadonlyURLSearchParams = Omit<
  URLSearchParams,
  "append" | "delete" | "sort" | "set"
>;

export interface TSafeSearchParams {
  /**
   * Underlying URLSearchParams object.
   */
  readonly urlSearchParams: TReadonlyURLSearchParams;

  /**
   * Get the search params as a string.
   */
  toString(): string;

  /**
   * Get a specific value as the given type.
   * Return null if the value does not match the type.
   * @param name
   * @param type
   */
  get<Out>(name: string, type: TDatatype<Out>): Out | null;

  /**
   * Get a specific value as the given type.
   * Throw an error if the value does not match the type.
   * @param name
   * @param type
   */
  getOrThrow<Out>(name: string, type: TDatatype<Out>): Out;

  /**
   * Check if a specific parameter exists AND matches the given type.
   * @param name
   * @param type
   */
  has(name: string, type: TDatatype<any>): boolean;

  /**
   * Get multiple values using the given mapping of name and types.
   * If a type does not match, the value will be null.
   * @param obj
   */
  getObj<Obj extends TDtObjBase>(obj: Obj): TDtObjOutput<Obj>;

  /**
   * Get multiple values as the given type, throwing an error if any values are invalid.
   * @param obj
   */
  getObjOrThrow<Obj extends TDtObjBase>(
    obj: Obj,
  ): TDtObjOutputStrict<Obj>;

  /**
   * Add a new value to the search params.
   * @param name
   * @param type
   * @param value
   */
  append<T>(name: string, type: TDatatype<T>, value: T): TSafeSearchParams;

  /**
   * Delete a value from the search params.
   * @param name
   */
  delete(name: string): TSafeSearchParams;

  /**
   * Set a single value.
   * @param name
   * @param type
   * @param update
   */
  set<T>(
    name: string,
    type: TDatatype<T>,
    value: T,
  ): TSafeSearchParams;

  /**
   * Sort the search params by name.
   */
  sort(): TSafeSearchParams;

  /**
   * Set multiple values using the given mapping of name and types.
   * @param obj
   * @param update
   */
  setObj<Obj extends TDtObjBase>(
    obj: Obj,
    values: TDtObjOutput<Obj>,
  ): TSafeSearchParams;
}
