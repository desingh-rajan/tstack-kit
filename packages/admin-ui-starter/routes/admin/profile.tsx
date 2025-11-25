import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { createApiClient } from "@/lib/api.ts";
import { userService } from "@/entities/users/user.service.ts";
import type { User } from "@/entities/users/user.types.ts";

interface ProfileData {
  user: User | null;
  error?: string;
}

export const handler = define.handlers({
  async GET(ctx) {
    const cookies = ctx.req.headers.get("cookie") || "";
    const authToken = cookies.match(/auth_token=([^;]+)/)?.[1];

    if (!authToken) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/auth/login" },
      });
    }

    let user: User | null = null;
    let error: string | undefined;

    try {
      // Decode token to get user ID
      const payload = authToken.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      const userId = decoded.userId || decoded.id;

      if (!userId) {
        throw new Error("User ID not found in token");
      }

      // Fetch user details
      const apiClient = createApiClient(authToken);
      userService.setClient(apiClient);
      user = await userService.getById(userId);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      error = err instanceof Error ? err.message : "Failed to load profile";
    }

    return { data: { user, error } };
  },
});

export default define.page<typeof handler>(function ProfilePage({ data }) {
  const { user, error } = data;

  return (
    <AdminLayout currentPath="/admin/profile">
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold">Profile</h1>
          <p class="text-base-content/60 mt-2">
            View your account information
          </p>
        </div>

        {error && (
          <div class="alert alert-error mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {user && (
          <>
            {/* Profile Card */}
            <div class="card bg-base-100 shadow-xl mb-6">
              <div class="card-body">
                <div class="flex items-start gap-6">
                  {/* Avatar */}
                  <div class="avatar placeholder">
                    <div class="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-full w-24 h-24 ring ring-primary ring-offset-base-100 ring-offset-4">
                      <span class="text-4xl font-bold">
                        {user.username
                          ? user.username[0].toUpperCase()
                          : user.email[0].toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div class="flex-1">
                    <h2 class="card-title text-2xl mb-2">
                      {user.username || "User"}
                    </h2>
                    <div class="flex gap-2 mb-4">
                      <div
                        class={`badge ${
                          user.role === "superadmin"
                            ? "badge-error"
                            : user.role === "admin"
                            ? "badge-warning"
                            : "badge-ghost"
                        }`}
                      >
                        {user.role}
                      </div>
                      {user.isActive && (
                        <div class="badge badge-success">Active</div>
                      )}
                      {user.isEmailVerified && (
                        <div class="badge badge-info">Email Verified</div>
                      )}
                    </div>
                    <p class="text-base-content/60">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Information */}
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <h3 class="card-title text-lg mb-4">Account Information</h3>
                  <div class="space-y-4">
                    <div>
                      <label class="text-sm text-base-content/60 font-semibold">
                        User ID
                      </label>
                      <p class="mt-1 font-mono">{user.id}</p>
                    </div>

                    <div>
                      <label class="text-sm text-base-content/60 font-semibold">
                        Username
                      </label>
                      <p class="mt-1">{user.username || "Not set"}</p>
                    </div>

                    <div>
                      <label class="text-sm text-base-content/60 font-semibold">
                        Email Address
                      </label>
                      <p class="mt-1">{user.email}</p>
                    </div>

                    {user.phone && (
                      <div>
                        <label class="text-sm text-base-content/60 font-semibold">
                          Phone Number
                        </label>
                        <p class="mt-1">{user.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <h3 class="card-title text-lg mb-4">Account Status</h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <label class="text-sm text-base-content/60 font-semibold">
                          Account Status
                        </label>
                        <p class="mt-1">
                          {user.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <div
                        class={`badge ${
                          user.isActive ? "badge-success" : "badge-error"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>

                    <div class="flex items-center justify-between">
                      <div>
                        <label class="text-sm text-base-content/60 font-semibold">
                          Email Verification
                        </label>
                        <p class="mt-1">
                          {user.isEmailVerified ? "Verified" : "Not Verified"}
                        </p>
                      </div>
                      <div
                        class={`badge ${
                          user.isEmailVerified
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {user.isEmailVerified ? "Verified" : "Pending"}
                      </div>
                    </div>

                    <div>
                      <label class="text-sm text-base-content/60 font-semibold">
                        Role
                      </label>
                      <p class="mt-1 capitalize">{user.role}</p>
                    </div>

                    {user.lastLoginAt && (
                      <div>
                        <label class="text-sm text-base-content/60 font-semibold">
                          Last Login
                        </label>
                        <p class="mt-1">
                          {new Date(user.lastLoginAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div class="card bg-base-100 shadow-xl md:col-span-2">
                <div class="card-body">
                  <h3 class="card-title text-lg mb-4">Activity</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="text-sm text-base-content/60 font-semibold">
                        Account Created
                      </label>
                      <p class="mt-1">
                        {new Date(user.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label class="text-sm text-base-content/60 font-semibold">
                        Last Updated
                      </label>
                      <p class="mt-1">
                        {new Date(user.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!user && !error && (
          <div class="flex items-center justify-center py-12">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
});
