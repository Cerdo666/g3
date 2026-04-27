// Utility for making API requests with JWT token and automatic refresh

let accessToken: string | null = null;
let apiUrl: string = '';

export function setApiConfig(token: string | null, url: string) {
  accessToken = token;
  apiUrl = url;
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  refreshToken?: string
): Promise<T> {
  const url = `${apiUrl}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If access token expired and we have a refresh token, try to refresh
  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(`${apiUrl}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!refreshResponse.ok) {
        // Refresh failed, token is revoked or invalid
        return Promise.reject(new Error('Token refresh failed'));
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Retry original request with new token
      headers.set('Authorization', `Bearer ${accessToken}`);
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'API request failed');
  }

  return data;
}
