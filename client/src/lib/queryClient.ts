import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Error logging utility for client-side
interface ClientErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  method?: string;
  url?: string;
  status?: number;
  details?: any;
}

function logClientError(error: ClientErrorLog) {
  const logEntry = {
    ...error,
    timestamp: error.timestamp || new Date().toISOString(),
  };

  // Log to console with proper formatting and grouping
  console.group(`%c${logEntry.level.toUpperCase()}: ${logEntry.message}`, 
    `color: ${error.level === 'error' ? 'red' : error.level === 'warn' ? 'orange' : 'blue'}`);
  console.log('Timestamp:', logEntry.timestamp);
  if (error.method) console.log('Method:', error.method);
  if (error.url) console.log('URL:', error.url);
  if (error.status) console.log('Status:', error.status);
  if (error.details) console.log('Details:', error.details);
  console.groupEnd();
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const error = new Error(`${res.status}: ${text}`);
    logClientError({
      level: 'error',
      message: 'API Request Failed',
      method: res.type,
      url: res.url,
      status: res.status,
      details: text,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    // Log the error with full context
    logClientError({
      level: 'error',
      message: error.message || 'API Request Failed',
      method,
      url,
      details: {
        data,
        error: error.toString(),
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      logClientError({
        level: 'error',
        message: 'Query Failed',
        method: 'GET',
        url: queryKey[0] as string,
        details: {
          error: error.toString(),
          stack: error.stack
        },
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});