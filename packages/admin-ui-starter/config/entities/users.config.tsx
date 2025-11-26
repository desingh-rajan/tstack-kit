/**
 * User Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type { User } from "@/entities/users/user.types.ts";
import { userService } from "@/entities/users/user.service.ts";

export const userConfig: EntityConfig<User> = {
  name: "users",
  singularName: "User",
  pluralName: "Users",
  apiPath: "/ts-admin/users",
  idField: "id",

  displayField: "email",
  descriptionField: "username",

  service: userService,

  fields: [
    {
      name: "id",
      label: "ID",
      type: "number",
      showInList: true,
      showInShow: true,
      showInForm: false,
      sortable: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
      searchable: true,
      placeholder: "user@example.com",
    },
    {
      name: "username",
      label: "Username",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "username",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: true,
      showInList: false,
      showInShow: false,
      showInForm: true,
      placeholder: "Enter password",
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      options: [
        { value: "user", label: "User" },
        { value: "admin", label: "Admin" },
        { value: "superadmin", label: "Superadmin" },
      ],
      render: (value) => {
        const badges: Record<string, string> = {
          superadmin: "badge-error",
          admin: "badge-warning",
          user: "badge-ghost",
        };
        const badgeClass = badges[String(value)] || "badge-ghost";
        return <span class={`badge ${badgeClass}`}>{String(value)}</span>;
      },
    },
    {
      name: "isActive",
      label: "Active",
      type: "boolean",
      showInList: true,
      showInShow: true,
      showInForm: true,
      render: (value) =>
        value
          ? <span class="badge badge-success">Active</span>
          : <span class="badge badge-error">Inactive</span>,
    },
    {
      name: "isEmailVerified",
      label: "Email Verified",
      type: "boolean",
      showInList: true,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "lastLoginAt",
      label: "Last Login",
      type: "datetime",
      showInList: true,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "createdAt",
      label: "Created At",
      type: "datetime",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "updatedAt",
      label: "Updated At",
      type: "datetime",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
  ],

  canCreate: true,
  canEdit: true,
  canDelete: true,
  canView: true,

  isSystemRecord: (record) => record.role === "superadmin",
};
