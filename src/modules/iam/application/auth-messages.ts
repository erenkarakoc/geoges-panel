import type { AuthFailureCode } from "@/modules/iam/domain/auth-provider";

/**
 * Turkish messages for the port's failure codes (ADR-011). Wording never reveals whether an
 * account exists: a wrong e-mail and a wrong password give the same message.
 */
const messages: Record<AuthFailureCode, string> = {
  invalid_credentials: "E-posta veya parola hatalı.",
  invalid_code: "Doğrulama kodu hatalı veya süresi dolmuş. Uygulamadaki yeni kodu girin.",
  two_factor_required: "Devam etmek için iki adımlı doğrulamayı tamamlayın.",
  rate_limited: "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.",
  weak_password: "Parola yeterince güçlü değil. Daha uzun ve karışık bir parola seçin.",
  same_password: "Yeni parola eskisiyle aynı olamaz.",
  expired_link: "Bağlantının süresi dolmuş. Yeni bir parola sıfırlama bağlantısı isteyin.",
  not_authenticated: "Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.",
  unknown: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
};

export function authFailureMessage(code: AuthFailureCode): string {
  return messages[code];
}
