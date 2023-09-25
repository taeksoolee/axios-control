import axios, { AxiosInstance, CreateAxiosDefaults, AxiosProgressEvent } from 'axios';

type RequestConfig = {
  authorizationKey?: string,
  authorizationPrefix?: string,
}

type ProgressType = 'upload' | 'download';
type ProgressHandler = (type: ProgressType, e?: AxiosProgressEvent) => void;

const DefaultConfig = {
  authorizationKey: 'Authorization',
  authorizationPrefix: 'Bearer'
} as const;


export class Request {
  private readonly _instance!: AxiosInstance;
  private readonly _authorizationKey!: string;
  private readonly _authorizationPrefix!: string;
  
  constructor(axiosConfig?: CreateAxiosDefaults, config?: RequestConfig) {
    this._instance = axios.create(axiosConfig);
    this._authorizationKey = config?.authorizationKey ?? DefaultConfig.authorizationKey;
    this._authorizationPrefix = config?.authorizationPrefix ?? DefaultConfig.authorizationPrefix;
  }

  set token(accessToken: string) {
    this._instance.defaults.headers[this._authorizationKey] = `${this._authorizationPrefix} ${accessToken}`;
  }

  get(url: string, params?: Record<string, unknown>) {
    const controller = new AbortController();

    const response = this._instance.get<unknown>(url, {
      params: params,
      signal: controller.signal,
    });

    type Parse = <T>(input: (input: unknown) => T) =>  Promise<T>;

    const parse: Parse = (input) => response.then(res => input(res.data));

    return {
      response,
      parse,
      controller,
    };
  }

  downlaod(url: string, data?: Record<string, unknown>) {
    const controller = new AbortController();

    const progressHandler = new (class CreateProcessHandler {
      private _handler: ProgressHandler = () => {};
      
      get() {
        return this._handler;
      }

      set(handler: ProgressHandler) {
        this._handler = handler;
      }
    })();

    const onProgress = (type: ProgressType, e: AxiosProgressEvent) => {
      const handler = progressHandler.get();
      handler && handler(type, e);
    }

    const response = this._instance.post<unknown>(url, data, {
      signal: controller.signal,
      onUploadProgress: (e) => onProgress('upload', e),
      onDownloadProgress: (e) => onProgress('download', e),
    });

    type Parse = <T>(input: (input: unknown) => T) =>  Promise<T>;

    const parse: Parse = (input) => response.then(res => input(res.data));

    return {
      response,
      parse,
      controller,
      progressHandler,
    };
  }
}