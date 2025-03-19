import type { TDatatype, TDtParseOutput } from "./types.ts";

/**
 * Will fail if the value is returned is missing, `null` or `undefined`.
 * @param parser - The datatype parser to be wrapped.
 * @returns A new datatype parser that ensures the value is not null or undefined.
 */
export function rRequired<TOut>(
  parser: TDatatype<TOut>,
): TDatatype<NonNullable<TOut>> {
  return {
    name: `Required<${parser.name}>`,
    parse: (input) => {
      const parsed = parser.parse(input);
      if (!parsed.valid) {
        return parsed;
      }
      if (parsed.value === null || parsed.value === undefined) {
        return { valid: false, error: "Missing value" };
      }
      return parsed as TDtParseOutput<NonNullable<TOut>>;
    },
    serialize: (output) => {
      return parser.serialize(output);
    },
  };
}

/**
 * This is the base datatype for parsing and serializing strings.
 * @returns A datatype parser for strings.
 */
export function rString(): TDatatype<string | null> {
  return {
    name: "String",
    parse: (input) => {
      const last = getFirst(input);
      return { valid: true, value: last };
    },
    serialize: (output) => output === null ? [] : [output],
  };
}

/**
 * This is the base datatype for parsing and serializing integers.
 * @returns A datatype parser for integers.
 */
export function rInteger(): TDatatype<number | null> {
  return {
    name: "Integer",
    parse: (input) => {
      const last = getFirst(input);
      if (last === null) {
        return { valid: true, value: null };
      }
      const parsed = parseInt(last, 10);
      if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
        return { valid: false, error: "Invalid integer" };
      }
      if (parsed.toFixed() !== last) {
        return { valid: false, error: "Invalid integer" };
      }
      return { valid: true, value: parsed };
    },
    serialize: (output) => output === null ? [] : [output.toFixed()],
  };
}

/**
 * This is the base datatype for checking the presence of a value.
 * @returns A datatype parser that checks if a value is present.
 */
export function rPresent(): TDatatype<boolean> {
  return {
    name: "Present",
    parse: (input) => {
      const last = getFirst(input);
      return { valid: true, value: last !== null };
    },
    serialize: (output) => output === true ? [""] : [],
  };
}

/**
 * This is the base datatype for parsing and serializing strings that match a given regex.
 * @param regex - The regular expression to match against.
 * @returns A datatype parser for strings that match the regex.
 */
export function rRegex(
  regex: RegExp,
): TDatatype<string | null> {
  return {
    name: `Regex<${regex.source}>`,
    parse: (input) => {
      const last = getFirst(input);
      if (last === null) {
        return { valid: true, value: null };
      }
      if (!regex.test(last)) {
        return { valid: false, error: "Invalid value" };
      }
      return { valid: true, value: last };
    },
    serialize: (output) => output === null ? [] : [output],
  };
}

/**
 * This is the base datatype for parsing and serializing strings that match one of the given enum values.
 * @param values - The array of valid enum values.
 * @returns A datatype parser for strings that match one of the enum values.
 */
export function rEnum<const T extends string>(
  values: T[],
): TDatatype<T | null> {
  return {
    name: `Enum<${values.join(" | ")}>`,
    parse: (input) => {
      const last = getFirst(input);
      if (last === null) {
        return { valid: true, value: null };
      }
      if (!values.includes(last as T)) {
        return { valid: false, error: "Invalid value" };
      }
      return { valid: true, value: last as T };
    },
    serialize: (output) => output === null ? [] : [output],
  };
}

/**
 * This is the base datatype for parsing and serializing arrays of a given subtype.
 * @param subType - The datatype parser for the elements of the array.
 * @returns A datatype parser for arrays of the given subtype.
 */
export function rMultiple<TOut>(
  subType: TDatatype<TOut>,
): TDatatype<TOut[]> {
  return {
    name: `Multiple<${subType.name}>`,
    parse: (input) => {
      const values: TOut[] = [];
      for (const value of input) {
        const parsed = subType.parse([value]);
        if (!parsed.valid) {
          return { valid: false, error: "Invalid value" };
        }
        values.push(parsed.value);
      }
      return { valid: true, value: values };
    },
    serialize: (output) => {
      const values: string[] = [];
      for (const value of output) {
        values.push(...subType.serialize(value));
      }
      return values;
    },
  };
}

function getFirst(input: string[]): string | null {
  if (input.length === 0) {
    return null;
  }
  return input[0];
}
