# 👑 SafeSearchParams

> A type-safe URLSearchParams

## Overview

SafeSearchParams is a library that provides a type-safe interface for working
with URL search parameters. It allows you to define and enforce types for your
search parameters, ensuring that your code is more robust and less error-prone.

SafeSearchParams is built on top of the native `URLSearchParams` API, providing
a familiar interface while adding type safety and validation. It supports
parsing and serializing values of various types, including strings, integers,
regular expressions, enums, and more (you can also define your own custom
types).

## Philosophy

When you work with search params you usually have something like this:

- Parse (and validate) the search params into a structured object
- Transform teh structured object back into search params when you navigate

This strategy has 2 issues:

- Any params that are not in the structured object are lost
- The order of the params is not preserved

This library aims to solve these issues by keeping the URLSearchParams object
and providing methods to update it.

## Installation

To install SafeSearchParams, you can use npm or yarn:

```sh
deno add jsr:@dldc/safe-search-params
```

## Usage

### Basic Usage

```typescript
import { rInteger, rString, safeSearchParams } from "@dldc/safe-search-params";

const params = safeSearchParams("a=1&b=2&c=hey");

console.log(params.get("a", rInteger())); // 1
console.log(params.get("b", rInteger())); // 2
console.log(params.get("c", rString())); // "hey"
console.log(params.get("d", rString())); // null
```

### Working with Objects

You can get multiple values as an object:

```typescript
const params = safeSearchParams("a=1&b=2&c=hey");
const obj = params.getObj({ a: rInteger(), b: rInteger(), c: rString() });
console.log(obj); // { a: 1, b: 2, c: "hey" }
```

### Handling Multiple Values

You can handle multiple values for a single parameter:

```typescript
const params = safeSearchParams("tag=first&tag=second&tag=third");
// by default it will return the first value
console.log(params.get("tag", rString())); // "first"
console.log(params.get("tag", rMultiple(rString()))); // ["first", "second", "third"]
```

### Updating Parameters

You can update parameters using the `set` and `setObj` methods:

```typescript
const params = safeSearchParams("a=1&b=2&c=hey");
const updated = params.set("a", rInteger(), 3);
console.log(updated.toString()); // "a=3&b=2&c=hey"

const updatedObj = params.setObj({ a: rInteger(), b: rInteger() }, {
  a: 3,
  b: 4,
});
console.log(updatedObj.toString()); // "a=3&b=4&c=hey"
```

### Deleting Parameters

You can delete parameters using the `delete` method:

```typescript
const params = safeSearchParams("a=1&b=2&c=hey");
const updated = params.delete("b");
console.log(updated.toString()); // "a=1&c=hey"
```

### Sorting Parameters

You can sort parameters by name using the `sort` method:

```typescript
const params = safeSearchParams("b=2&a=1&c=hey");
const sorted = params.sort();
console.log(sorted.toString()); // "a=1&b=2&c=hey"
```

### Error Handling

The library provides detailed error messages when validation fails:

```typescript
const params = safeSearchParams("a=1&b=2&c=hey");
try {
  params.getOrThrow("c", rInteger());
} catch (error) {
  console.error(error.message); // "Failed to validate Integer rule for property "c" with values: hey. Invalid integer"
}
```

### Writing Your Own Datatype

You can define your own custom datatype. Here is an example of a UUID datatype:

```typescript
import { TDatatype } from "@dldc/safe-search-params";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function rUUID(): TDatatype<string | null> {
  return {
    name: "UUID",
    parse: (input) => {
      const last = input.length > 0 ? input[0] : null;
      if (last === null || !uuidRegex.test(last)) {
        return { valid: false, error: "Invalid UUID" };
      }
      return { valid: true, value: last };
    },
    serialize: (output) => output === null ? [] : [output],
  };
}
```

## API Reference

### `safeSearchParams`

Creates a new `TSafeSearchParams` instance.

```typescript
function safeSearchParams(
  init?: Iterable<string[]> | Record<string, string> | string | URLSearchParams,
): TSafeSearchParams;
```

### `TSafeSearchParams`

#### Properties

- `urlSearchParams`: The underlying `URLSearchParams` object.

#### Methods

- `toString()`: Returns the search params as a string.
- `get<Out>(name: string, type: TDatatype<Out>): Out | null`: Gets a specific
  value as the given type.
- `getOrThrow<Out>(name: string, type: TDatatype<Out>): Out`: Gets a specific
  value as the given type, throwing an error if the value does not match the
  type.
- `has(name: string, type: TDatatype<any>): boolean`: Checks if a specific
  parameter exists and matches the given type.
- `getObj<Obj extends TDtObjBase>(obj: Obj): TDtObjOutput<Obj>`: Gets multiple
  values using the given mapping of name and types.
- `getObjOrThrow<Obj extends TDtObjBase>(obj: Obj): TDtObjOutputStrict<Obj>`:
  Gets multiple values as the given type, throwing an error if any values are
  invalid.
- `append<T>(name: string, type: TDatatype<T>, value: T): TSafeSearchParams`:
  Adds a new value to the search params.
- `delete(name: string): TSafeSearchParams`: Deletes a value from the search
  params.
- `set<T>(name: string, type: TDatatype<T>, value: T): TSafeSearchParams`: Sets
  a single value.
- `sort(): TSafeSearchParams`: Sorts the search params by name.
- `setObj<Obj extends TDtObjBase>(obj: Obj, values: TDtObjOutput<Obj>): TSafeSearchParams`:
  Sets multiple values using the given mapping of name and types.

### `TDatatype`

Defines a data type for parsing and serializing values.

```typescript
interface TDatatype<Out> {
  readonly name: string;
  parse: (input: string[]) => TDtParseOutput<Out>;
  serialize: (output: Out) => string[];
}
```

### Built-in Data Types

- `rString()`: Parses and serializes strings.
- `rInteger()`: Parses and serializes integers.
- `rPresent()`: Checks if a parameter is present.
- `rRegex(regex: RegExp)`: Parses and serializes values matching a regular
  expression.
- `rEnum(values: string[])`: Parses and serializes values from a predefined set.
- `rMultiple(subType: TDatatype<TOut>)`: Parses and serializes multiple values
  of a given type.
- `rRequired(parser: TDatatype<TOut>)`: Ensures that a value is not missing,
  `null`, or `undefined`.
- `rUUID()`: Parses and serializes UUIDs.
