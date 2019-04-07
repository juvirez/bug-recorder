declare module "chrome-har" {
  export function harFromMessages(messages: Object, options?: Options): Object;

  export interface Options {
    includeResourcesFromDiskCache?: boolean;
    includeTextFromResponseBody?: boolean;
  }

  export interface DevToolMessage {
    method: string;
    params: Object;
  }
}
