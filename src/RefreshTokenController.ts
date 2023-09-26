export default class RefreshTokenController {
  private readonly REFRESH_KEY = 'refresh-token';

  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_KEY) ?? '';
  }

  setRefreshToken(refreshToken: string) {
    return localStorage.setItem(this.REFRESH_KEY, refreshToken);
  }

  isExistRefreshToken() {
    return !!this.getRefreshToken();
  }
}