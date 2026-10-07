import axios from "axios";

export interface RealDebridUser {
  id: number;
  username: string;
  email: string;
  points: number;
  locale: string;
  avatar: string;
  type: "premium" | "free";
  premium: number; // Kalan süre (saniye)
  expiration: string;
}

export interface RealDebridValidationResult {
  valid: boolean;
  user?: RealDebridUser;
  isPremium?: boolean;
  daysRemaining?: number;
  error?: string;
}

const RD_API_BASE_URL = "https://api.real-debrid.com/rest/1.0";

/**
 * Real-Debrid API token geçerliliğini ve premium durumunu doğrular.
 */
export async function validateRealDebridToken(
  token: string,
): Promise<RealDebridValidationResult> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { valid: false, error: "API anahtarı boş olamaz." };
  }

  try {
    const response = await axios.get<RealDebridUser>(`${RD_API_BASE_URL}/user`, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
      },
      timeout: 10_000,
    });

    const user = response.data;
    const isPremium = user.type === "premium" && user.premium > 0;
    const daysRemaining = Math.max(0, Math.ceil(user.premium / 86400));

    return {
      valid: true,
      user,
      isPremium,
      daysRemaining,
    };
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401) {
        return { valid: false, error: "Geçersiz Real-Debrid API anahtarı (401 Unauthorized)." };
      }
      if (err.response?.status === 403) {
        return { valid: false, error: "Erişim reddedildi veya hesap askıya alınmış (403 Forbidden)." };
      }
      return {
        valid: false,
        error: `Real-Debrid API hatası (${err.response?.status || err.message}).`,
      };
    }
    return { valid: false, error: "Real-Debrid sunucusuna bağlanılamadı." };
  }
}
