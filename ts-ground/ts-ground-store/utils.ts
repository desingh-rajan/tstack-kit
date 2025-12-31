import { createDefine } from "fresh";
import type { Cart, User } from "@/lib/api.ts";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  shared: string;
  user?: User;
  cart?: Cart;
  token?: string;
}

export const define = createDefine<State>();
