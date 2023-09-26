import Request from "./Request";

import { AxiosError, CreateAxiosDefaults } from "axios";
import { RequestConfig } from "./types";
import RefreshTokenController from "./RefreshTokenController";

type RefreshFn = (tokens: {
  access?: string,
  refresh: string,
}, baseURL?: string) => Promise<string | null>;

/**
 * Include Auth
 */
export default class ReqeustExpand<JWTPayload extends Record<string, unknown>> extends Request {
  private readonly _refreshTokenController: RefreshTokenController = new RefreshTokenController();
  private readonly _refreshFn!: RefreshFn | null;

  constructor(config?: RequestConfig & {
    refreshFn?: RefreshFn,
  }, axiosConfig?: CreateAxiosDefaults) {
    super(
      {
        authorizationKey: config?.authorizationKey,
        authorizationPrefix: config?.authorizationPrefix,
      }, 
      axiosConfig
    );

    this._refreshFn = config?.refreshFn ?? null;
  }

  private _parseJWT(accessToken: string): ({ exp: number } & JWTPayload) | null {
    const base64Url = accessToken.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(escape(atob(base64)));
    return JSON.parse(jsonPayload);
  }

  private async _refreshAccessToken(tokens: {
    access?: string,
    refresh: string
  }) {
    const refreshFn = this._refreshFn;
    if (!refreshFn) {
      console.warn('refreshFn is undefined');
      return false;
    }

    const access = await refreshFn(tokens, this._instance.defaults.baseURL);
    if (!access) return false;
    
    console.log(access);
    this._setTokens({ access });
    return true;
  }

  async refresh() {
    const access = this._authorizationToken;
    if (!access) {
      console.warn('AccessToken is null')
      return;
    }
    
    const refresh = this._refreshTokenController.getRefreshToken();
    if (!refresh) {
      console.warn('RefreshToken is null')
      return;
    }

    console.log(access, refresh);
    this._refreshAccessToken({
      access, refresh
    });
  }

  private _setTokens(tokens: {
    access?: string,
    refresh?: string,
  }) {
    if (tokens.access) {
      this._token = tokens.access;
    }

    tokens.refresh && this._refreshTokenController.setRefreshToken(tokens.refresh);  
  }

  async sign(tokens: {
    access?: string,
    refresh?: string,
  }) {
    const { access, refresh } = tokens;

    access && this._setTokens({ access });
    refresh && this._setTokens({ refresh });

    if (!access && refresh) {
      this._refreshAccessToken({
        access, refresh
      });
    } 
    
    if (!access && !refresh) {
      const storageRefresh = this._refreshTokenController.getRefreshToken();
      if (storageRefresh) {
        this._refreshAccessToken({
          access, refresh: storageRefresh
        });
      }
    }
  }

  getWithVerify(url: string, searchParam?: URLSearchParams) {
    const { response, parse, controller } = this.get(url, searchParam);

    const returnValue = { response, parse, controller };

    const responseExpand = response.catch(async (err: AxiosError) => {
      // refresh catch handler
      
      const refreshToken = this._refreshTokenController.getRefreshToken();
      if (!refreshToken) {
        // refresh 토큰이 없을 경우 refresh를 실행하지 않는다.
        console.warn(1);
        throw err;
      }
    
      if (err.response?.status !== 401) { // !isUnauthorized
        // 401 외 다른 응답에서는 refresh 실행하지 않는다.
        console.log(2);
        throw err;
      }
    
      const accessToken = this._authorizationToken;
      if (!accessToken) { // !isExistAccessToken
        // accessToken이 존재하지 않다면 refresh 실행하지 않는다.
        console.log(3);
        throw err;
      }
    
      const payload = this._parseJWT(accessToken);
      if (payload) { // !isExistPayload
        const exp = payload.exp * 1000;
        if (Date.now() > exp) { // !isExpired
          // 만료기간이 지나지 않았지만 요청 실패 했을때는 api 이상 있는것으로 가정하여 refresh 하지 않는다.
          console.log(4);
          throw err;
        }
      }
    
      const refreshFn = this._refreshFn;
      if (!refreshFn) {
        console.warn('config.refreshFn is undefined');
        throw err;
      }

      const resultFlag = await this._refreshAccessToken({
        access: accessToken,
        refresh: refreshToken,
      })
    
      if (!resultFlag) {
        // token이 재발급 되지 않았습니다.
        console.log(5);
        throw err;
      }

      // 이전요청을 한번 더 요청하여 결과를 반환한다.
      const { response, controller } = this.get(url, searchParam);
      returnValue.response = response;
      returnValue.controller = controller;
      return response;
    });

    return returnValue;
  }

  /**
   * only getter
   */
  get currentJWTPayload() {
    const token = this._authorizationToken;
    if (!token) return null;
    const parsed = this._parseJWT(token);
    if (!parsed) return null;
    return this._parseJWT(token);
  }
}