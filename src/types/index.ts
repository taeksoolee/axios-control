import { AxiosProgressEvent } from "axios";

export type RequestConfig = {
  authorizationKey?: string,
  authorizationPrefix?: string,
}

export type ProgressType = 'upload' | 'download';
export type ProgressHandler = (type: ProgressType, e?: AxiosProgressEvent) => void;