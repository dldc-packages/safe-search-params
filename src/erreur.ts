import { createErreurStore } from "@dldc/erreur";
import type { TDatatype } from "./types.ts";

export type TSafeSearchParamsErreurData = {
  datatype: TDatatype<any>;
  property: string;
  values: string[];
  error: string;
};

const SafeSearchParamsErreurInternal = createErreurStore<
  TSafeSearchParamsErreurData
>();

export const SafeSearchParamsErreur = SafeSearchParamsErreurInternal.asReadonly;

export function createSafeSearchParamsErreur(
  property: string,
  datatype: TDatatype<any>,
  values: string[],
  error: string,
) {
  return SafeSearchParamsErreurInternal.setAndReturn(
    new Error(
      `Failed to validate ${datatype.name} rule for property "${property}" with values: ${
        values.join(", ")
      }. ${error}`,
    ),
    { property, datatype, values, error },
  );
}
