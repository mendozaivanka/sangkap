/**
 * What a data source has to provide. Return plain data in the shapes of `../schemas.ts`; the data layer
 * validates it, so a source can be a thin wrapper over files, a database query or an API call.
 */
export interface DataSource {
  /** Shown in build errors, e.g. "local" or "http". */
  name: string;
  sangkap: {
    compounds(): Promise<unknown>;
    servings(): Promise<unknown>;
    species(): Promise<unknown>;
    guidance(): Promise<unknown>;
    evidence(): Promise<unknown>;
    figures(): Promise<unknown>;
    sources(): Promise<unknown>;
    summary(): Promise<unknown>;
  };
}
