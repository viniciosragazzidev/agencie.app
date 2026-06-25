import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authRoutes = ["/login", "/register"];
const publicRoutes = ["/"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar arquivos estáticos e rotas da API do Better Auth para evitar loops
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Verificar autenticação usando o endpoint do Better Auth
  const authResponse = await fetch(new URL("/api/auth/get-session", request.url), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });

  const session = authResponse.ok ? await authResponse.json() : null;

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

  // Se estiver logado e tentar acessar login/register, redireciona pro dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Se NÃO estiver logado e tentar acessar uma rota protegida, redireciona pro login
  if (!session && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
