import BaseRequest from "./Request";

export default class RestRequest {
  private readonly _url!: string;
  private readonly _request!: BaseRequest;

  constructor(url: string, request: BaseRequest) {
    this._url = url;
    this._request = request;
  }

  getAll(searchParams?: URLSearchParams) {
    return this._request.get(this._url, searchParams);
  }

  getById(id: number, searchParams?: URLSearchParams) {
    return this._request.get(`${this._url}/${id}`, searchParams);
  }

  post(data: Record<string, unknown>) {
    return this._request.post(this._url, data);
  }

  put(id: number, data: Record<string, unknown>) {
    return this._request.put(`${this._url}/${id}`, data);
  }

  patch(id: number, data: Record<string, unknown>) {
    return this._request.patch(`${this._url}/${id}`, data);
  }

  delete(id: number) {
    return this._request.patch(`${this._url}/${id}`);
  }
}