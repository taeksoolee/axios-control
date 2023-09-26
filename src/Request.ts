import axios, { AxiosInstance, CreateAxiosDefaults, AxiosProgressEvent, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import z from 'zod';
import RestRequest from './RestRequest';
import { RequestConfig, ProgressHandler, ProgressType } from './types';

const DefaultConfig = {
  authorizationKey: 'Authorization',
  authorizationPrefix: 'Bearer'
} as const;

export default class Request {
  protected readonly _instance!: AxiosInstance;
  protected readonly _authorizationKey!: string;
  protected readonly _authorizationPrefix!: string;
  protected _authorizationToken: string | null = null;

  private _interceptorIds: Record<string, number | undefined> = {}
  
  constructor(config?: RequestConfig, axiosConfig?: CreateAxiosDefaults) {
    this._instance = axios.create(axiosConfig);

    this._authorizationKey = config?.authorizationKey ?? DefaultConfig.authorizationKey;
    this._authorizationPrefix = config?.authorizationPrefix ?? DefaultConfig.authorizationPrefix;

    const setToken = (function (this: Request, config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
      if (this._authorizationToken) {
        config.headers[this._authorizationKey] = this._authorizationPrefix + ' ' + this._authorizationToken;
      }
      return config;
    }).bind(this);

    console.log(setToken);

    this._instance.interceptors.request.use(setToken);
  }
  
  private _setRequestInterceptors(flag: boolean, key: string, handler: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig) {
    if (flag) {
      const id = this._instance.interceptors.request.use(handler);
      this._interceptorIds[key] = id;
    } else {
      const id = this._interceptorIds[key];
      id && this._instance.interceptors.request.eject(id);
    }
  }

  /**
   * only setter.
   */
  protected set _token(accessToken: string | null) {
    this._authorizationToken = accessToken;
  }

  clearToken() {
    delete this._instance.defaults.headers[this._authorizationKey];
  }
  
  /**
   * There is no getter for the lastSlash.
   * Set Before Append Last Slash
   * Ex: `${url}/`
   */
  set lastSlash(flag: boolean) {
    this._setRequestInterceptors(flag, 'last_slash', function appendLastSlash(config) {
      config.url = `${config.url}/`;
      return config;
    });
  }

  /**
   * @return zod parse from response
   */
  private _getParse(response: Promise<AxiosResponse<unknown>>): <T extends z.ZodTypeAny>(unknownZod: T) => Promise<ReturnType<T['parse']> | null> {
    return (unknownZod) => response.then(res => {
      try {
        return unknownZod.parse(res.data);
      } catch (err) {
        console.error('zod type error :: ', err);
        return null;
      }
    })
  }

  private _parseSearchParam(searchParam?: URLSearchParams) {
    const params: any = {};

    searchParam && Array
      .from(searchParam.keys())
      .forEach((key) => {
        params[key] = searchParam.get(key);
      });

    return params;
  }

  protected _returnValues<D>(response: Promise<AxiosResponse<D, any>>, controller: AbortController) {
    return {
      response,
      parse: this._getParse(response),
      controller,
    };
  }

  /**
   * Request http using the GET method
   */
  get<D extends any = unknown>(url: string, searchParam?: URLSearchParams) {
    const controller = new AbortController();
    const params = this._parseSearchParam(searchParam);

    const response = this._instance.get<D>(url, {
      params: params,
      signal: controller.signal,
    });

    return this._returnValues(response, controller);
  }

  /**
   * Request http using the POST method.
   */
  post<D extends any = unknown>(url: string, data?: Record<string, unknown>) {
    const controller = new AbortController();
    const response = this._instance.post<D>(url, data, {
      signal: controller.signal,
    });

    return this._returnValues(response, controller);
  }

  /**
   * Request http using the PUT method.
   */
  put<D extends any = unknown>(url: string, data?: Record<string, unknown>) {
    const controller = new AbortController();
    const response = this._instance.put<D>(url, data, {
      signal: controller.signal,
    });

    return this._returnValues(response, controller);
  }

  /**
   * Request http using the PATCH method.
   */
  patch<D extends any = unknown>(url: string, data?: Record<string, unknown>) {
    const controller = new AbortController();
    const response = this._instance.patch<D>(url, data, {
      signal: controller.signal,
    });

    return this._returnValues(response, controller);
  }

  delete<D extends any = unknown>(url: string) {
    const controller = new AbortController();
    const response = this._instance.delete<D>(url, {
      signal: controller.signal,
    });

    return this._returnValues(response, controller);
  }

  /**
   * @deprecated in developing...
   */ 
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

    return {
      response,
      parse: this._getParse(response),
      controller,
      progressHandler,
    };
  }

  rest(url: string) {
    return new RestRequest(url, this);
  }

  syncToken(from: Request) {
    // this._instance.defaults = cloneDeep(from._instance.defaults);
    this._authorizationToken = from._authorizationToken;
  }

  syncBaseURL(from: Request) {
    this._instance.defaults.baseURL = from._instance.defaults.baseURL;
  }
}