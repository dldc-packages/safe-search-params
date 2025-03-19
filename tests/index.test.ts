import { expect } from "@std/expect";
import {
  rEnum,
  rInteger,
  rMultiple,
  rPresent,
  rRegex,
  rRequired,
  rString,
  safeSearchParams,
} from "../mod.ts";

Deno.test("Basic usage", () => {
  const params = safeSearchParams("a=1&b=2&c=hey");
  expect(params.get("a", rInteger())).toEqual(1);
  expect(params.get("b", rInteger())).toEqual(2);
  expect(params.get("c", rString())).toEqual("hey");
  expect(params.get("d", rString())).toEqual(null);
});

Deno.test("Obj", () => {
  const params = safeSearchParams("a=1&b=2&c=hey");
  const obj = params.getObj({ a: rInteger(), b: rInteger(), c: rString() });
  expect(obj).toEqual({ a: 1, b: 2, c: "hey" });
});

Deno.test("Multi", () => {
  const params = safeSearchParams("tag=first&tag=second&tag=third");
  expect(params.get("tag", rString())).toEqual("first");
  expect(params.get("tag", rMultiple(rString()))).toEqual([
    "first",
    "second",
    "third",
  ]);
});

Deno.test("Multi update", () => {
  const dt = rMultiple(rString());
  const params = safeSearchParams("tag=first&other=hey&tag=second&tag=third");
  expect(params.get("tag", dt)).toEqual(["first", "second", "third"]);
  const updated = params.set("tag", dt, ["first", "second", "third", "fourth"]);
  expect(updated.toString()).toEqual(
    "tag=first&other=hey&tag=second&tag=third&tag=fourth",
  );
  const updated2 = updated.set("tag", dt, ["a", "b"]);
  expect(updated2.toString()).toEqual("tag=a&other=hey&tag=b");
  const sorted = updated2.sort();
  expect(sorted.toString()).toEqual("other=hey&tag=a&tag=b");
});

Deno.test("GetOrThrow", () => {
  const params = safeSearchParams("a=1&b=2&c=hey");
  expect(() => params.getOrThrow("c", rInteger())).toThrow();
});

Deno.test("Has", () => {
  const params = safeSearchParams("a=1&b=2&c=hey");
  expect(params.has("a", rInteger())).toEqual(true);
  expect(params.has("b", rInteger())).toEqual(true);
  expect(params.has("c", rInteger())).toEqual(false);
});

Deno.test("Set", () => {
  const params = safeSearchParams("a=1&b=2&c=hey");
  const updated = params.set("a", rInteger(), 3);
  expect(updated.toString()).toEqual("a=3&b=2&c=hey");
});

Deno.test("Delete", () => {
  const params = safeSearchParams("a=1&b=2&c=hey");
  const updated = params.delete("b");
  expect(updated.toString()).toEqual("a=1&c=hey");
});

Deno.test("SetObj", () => {
  const params = safeSearchParams("a=1&b=2&c=hey");
  const updated = params.setObj({ a: rInteger(), b: rInteger() }, {
    a: 3,
    b: 4,
  });
  expect(updated.toString()).toEqual("a=3&b=4&c=hey");
});

Deno.test("SetObj partial", () => {
  const params = safeSearchParams("a=1&b=2&c=hey");
  const updated = params.setObj({ a: rInteger(), b: rInteger() }, {
    a: 3,
    b: null,
  });
  expect(updated.toString()).toEqual("a=3&c=hey");
});

Deno.test("All datatypes", async (t) => {
  await t.step("rString", () => {
    const params = safeSearchParams("a=1&b=2&c=hey");
    expect(params.get("c", rString())).toEqual("hey");
    expect(params.get("d", rString())).toEqual(null);
    expect(params.get("a", rString())).toEqual("1");
  });

  await t.step("rInteger", () => {
    const params = safeSearchParams("a=1&b=2&c=hey");
    expect(params.get("a", rInteger())).toEqual(1);
    expect(params.get("b", rInteger())).toEqual(2);
    expect(params.get("c", rInteger())).toEqual(null);
  });

  await t.step("rPresent", () => {
    const params = safeSearchParams("a=1&b=2&c=hey");
    expect(params.get("a", rPresent())).toEqual(true);
    expect(params.get("b", rPresent())).toEqual(true);
    expect(params.get("c", rPresent())).toEqual(true);
    expect(params.get("d", rPresent())).toEqual(false);
  });

  await t.step("rRegex", () => {
    const params = safeSearchParams("a=1&b=2&c=hey");
    expect(params.get("a", rRegex(/^[0-9]+$/))).toEqual("1");
    expect(params.get("b", rRegex(/^[0-9]+$/))).toEqual("2");
    expect(params.get("c", rRegex(/^[0-9]+$/))).toEqual(null);
  });

  await t.step("rEnum", () => {
    const params = safeSearchParams("a=1&b=2&c=hey");
    expect(params.get("a", rEnum(["1", "2"]))).toEqual("1");
    expect(params.get("b", rEnum(["1", "2"]))).toEqual("2");
    expect(params.get("c", rEnum(["1", "2"]))).toEqual(null);
    expect(params.get("d", rEnum(["1", "2"]))).toEqual(null);
  });
});

Deno.test("Required", () => {
  const params = safeSearchParams("a=1&b=2&c=hey");
  expect(params.get("a", rRequired(rInteger()))).toEqual(1);
  // getOrThrow should return null when missing
  expect(params.getOrThrow("d", rString())).toEqual(null);
  // but it should throw when required
  expect(() => params.getOrThrow("d", rRequired(rString()))).toThrow();
});
