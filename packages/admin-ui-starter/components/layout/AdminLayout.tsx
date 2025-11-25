import { ComponentChildren } from "preact";
import ThemeSwitcher from "../../islands/ThemeSwitcher.tsx";

interface AdminLayoutProps {
  children: ComponentChildren;
  currentPath: string;
}

export function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const menuItems = [
    { path: "/admin/articles", label: "Articles", icon: "📄" },
    { path: "/admin/site-settings", label: "Site Settings", icon: "⚙" },
    { path: "/admin/users", label: "Users", icon: "👤" },
  ];

  return (
    <div class="drawer lg:drawer-open">
      <input id="admin-drawer" type="checkbox" class="drawer-toggle" />

      <div class="drawer-content flex flex-col">
        {/* Header */}
        <div class="w-full navbar bg-base-300">
          <div class="flex-none lg:hidden">
            <label
              htmlFor="admin-drawer"
              class="btn btn-square btn-ghost"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="inline-block w-6 h-6 stroke-current"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
          </div>

          <div class="flex-1 px-2 mx-2">
            <span class="text-lg font-bold">Admin Dashboard</span>
          </div>

          <div class="flex-none gap-2">
            <ThemeSwitcher />
            <div class="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                class="btn btn-ghost btn-circle avatar"
              >
                <div class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <div class="bg-gradient-to-br from-primary to-secondary flex items-center justify-center h-full">
                    <span class="text-primary-content font-bold text-lg">
                      A
                    </span>
                  </div>
                </div>
              </div>
              <ul
                tabIndex={0}
                class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300 mt-3"
              >
                <li class="menu-title">
                  <span class="text-xs opacity-60">Account</span>
                </li>
                <li>
                  <a
                    href="/admin/profile"
                    class="gap-3 hover:bg-base-200 active:!bg-base-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </a>
                </li>
                <div class="divider my-1"></div>
                <li>
                  <a
                    href="/auth/logout"
                    class="gap-3 text-error hover:bg-error/10 active:!bg-error/20"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div class="p-4 lg:p-8">
          {children}
        </div>
      </div>

      {/* Sidebar */}
      <div class="drawer-side">
        <label htmlFor="admin-drawer" class="drawer-overlay" />
        <aside class="bg-base-200 w-64 min-h-full">
          <div class="p-4">
            <h1 class="text-xl font-bold mb-6">tstack-kit</h1>
          </div>

          <ul class="menu px-2">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <li key={item.path}>
                  <a
                    href={item.path}
                    class={isActive
                      ? "bg-primary text-primary-content font-semibold"
                      : "hover:bg-base-300"}
                  >
                    <span class="text-xl">{item.icon}</span>
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
