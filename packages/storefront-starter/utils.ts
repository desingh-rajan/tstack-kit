import { createDefine } from "fresh";
import type { ApiClient, Cart, User } from "@/lib/api.ts";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  shared: string;
  user?: User;
  cart?: Cart;
  token?: string;
  api: ApiClient; // Per-request API client (set in middleware)
}

export const define = createDefine<State>();
