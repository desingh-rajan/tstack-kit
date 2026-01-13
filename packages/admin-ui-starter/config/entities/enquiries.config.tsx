/**
 * Enquiry Entity Configuration
 * Contact form submissions management
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type {
  Enquiry,
  EnquiryStatus,
} from "@/entities/enquiries/enquiry.types.ts";
import { enquiryService } from "@/entities/enquiries/enquiry.service.ts";

// Status badge colors
const STATUS_COLORS: Record<EnquiryStatus, string> = {
  new: "badge-primary",
  read: "badge-info",
  replied: "badge-success",
  spam: "badge-error",
  archived: "badge-ghost",
};

// Status labels
const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  spam: "Spam",
  archived: "Archived",
};

export const enquiryConfig: EntityConfig<Enquiry> = {
  name: "enquiries",
  singularName: "Enquiry",
  pluralName: "Enquiries",
  apiPath: "/ts-admin/enquiries",
  idField: "id",

  displayField: "email",
  descriptionField: "subject",

  service: enquiryService,

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
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
      options: [
        { value: "new", label: "New" },
        { value: "read", label: "Read" },
        { value: "replied", label: "Replied" },
        { value: "spam", label: "Spam" },
        { value: "archived", label: "Archived" },
      ],
      render: (value) => {
        const status = value as EnquiryStatus;
        return (
          <span class={`badge ${STATUS_COLORS[status] || "badge-ghost"}`}>
            {STATUS_LABELS[status] || status}
          </span>
        );
      },
    },
    {
      name: "name",
      label: "Name",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: false,
      sortable: true,
      searchable: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      showInList: true,
      showInShow: true,
      showInForm: false,
      sortable: true,
      searchable: true,
    },
    {
      name: "phone",
      label: "Phone",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: false,
      searchable: true,
    },
    {
      name: "company",
      label: "Company",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: false,
      searchable: true,
    },
    {
      name: "subject",
      label: "Subject",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: false,
      searchable: true,
    },
    {
      name: "message",
      label: "Message",
      type: "text",
      showInList: false,
      showInShow: true,
      showInForm: false,
      searchable: true,
    },
    {
      name: "adminNotes",
      label: "Admin Notes",
      type: "text",
      showInList: false,
      showInShow: true,
      showInForm: true,
      rows: 5,
      placeholder: "Internal notes about this enquiry...",
      helpText: "Only visible to admin users",
    },
    {
      name: "ipAddress",
      label: "IP Address",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "userAgent",
      label: "User Agent",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "referrer",
      label: "Referrer",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "honeypotTriggered",
      label: "Spam Detected",
      type: "boolean",
      showInList: false,
      showInShow: true,
      showInForm: false,
      render: (value) => {
        const isSpam = Boolean(value);
        return (
          <span class={`badge ${isSpam ? "badge-error" : "badge-success"}`}>
            {isSpam ? "Yes" : "No"}
          </span>
        );
      },
    },
    {
      name: "readAt",
      label: "Read At",
      type: "datetime",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "repliedAt",
      label: "Replied At",
      type: "datetime",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "createdAt",
      label: "Submitted At",
      type: "datetime",
      showInList: true,
      showInShow: true,
      showInForm: false,
      sortable: true,
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

  // Enquiries are read-only from admin (no create), only status/notes editable
  canCreate: false,
  canEdit: true,
  canDelete: true,
  canView: true,
};
