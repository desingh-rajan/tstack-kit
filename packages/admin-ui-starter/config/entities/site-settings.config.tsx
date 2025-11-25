/**
 * Site Setting Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type { SiteSetting } from "@/entities/site_settings/site-setting.types.ts";
import { siteSettingService } from "@/entities/site_settings/site-setting.service.ts";

export const siteSettingConfig: EntityConfig<SiteSetting> = {
  name: "site-settings",
  singularName: "Site Setting",
  pluralName: "Site Settings",
  apiPath: "/ts-admin/site_settings",
  idField: "id",

  displayField: "key",
  descriptionField: "description",

  service: siteSettingService,

  fields: [
    {
      name: "id",
      label: "ID",
      type: "number",
      showInList: true,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "key",
      label: "Key",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
      searchable: true,
      placeholder: "site.title",
      helpText: "Unique identifier (e.g., site.title, theme.color)",
      render: (value) => (
        <span class="font-mono text-sm font-bold">{String(value)}</span>
      ),
    },
    {
      name: "value",
      label: "Value",
      type: "json",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      rows: 6,
      placeholder: "Enter valid JSON object",
      render: (value) => {
        if (typeof value === "object") {
          return (
            <pre class="text-xs p-2 bg-base-200 rounded max-w-xs overflow-x-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          );
        }
        const str = String(value);
        if (str.length > 100) {
          return <span title={str}>{str.slice(0, 100)}...</span>;
        }
        return <span>{str}</span>;
      },
      format: (value) => {
        if (typeof value === "object") {
          return JSON.stringify(value, null, 2).slice(0, 100) + "...";
        }
        const str = String(value);
        return str.length > 100 ? str.slice(0, 100) + "..." : str;
      },
    },
    {
      name: "description",
      label: "Description",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: true,
      placeholder: "What this setting controls",
      helpText: "Optional description of what this setting does",
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      options: [
        { value: "general", label: "General" },
        { value: "appearance", label: "Appearance" },
        { value: "email", label: "Email" },
        { value: "features", label: "Features" },
      ],
      render: (value) => (
        <span class="badge badge-outline">{String(value)}</span>
      ),
    },
    {
      name: "isPublic",
      label: "Public",
      type: "boolean",
      showInList: true,
      showInShow: true,
      showInForm: true,
      helpText: "Can this setting be accessed without authentication?",
      render: (value) =>
        value
          ? <span class="badge badge-success badge-sm">Public</span>
          : <span class="badge badge-ghost badge-sm">Private</span>,
    },
    {
      name: "isSystem",
      label: "System",
      type: "boolean",
      showInList: true,
      showInShow: true,
      showInForm: false,
      render: (value) =>
        value ? <span class="badge badge-warning badge-sm">System</span> : null,
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

  isSystemRecord: (record) => record.isSystem === true,
};
