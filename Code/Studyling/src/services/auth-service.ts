export interface SessionUser { id: string; name: string; email?: string; }
export interface AuthService { getSession(): Promise<SessionUser | null>; signIn(): Promise<void>; signOut(): Promise<void>; }
export const demoAuthService: AuthService = { async getSession(){ return { id:"demo", name:"Eymen" }; }, async signIn(){}, async signOut(){} };
