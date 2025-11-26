/**
 * Article Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type { Article } from "@/entities/articles/article.types.ts";
import { articleService } from "@/entities/articles/article.service.ts";

export const articleConfig: EntityConfig<Article> = {
  name: "articles",
  singularName: "Article",
  pluralName: "Articles",
  apiPath: "/ts-admin/articles",
  idField: "id",

  displayField: "title",
  descriptionField: "slug",

  service: articleService,

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
      name: "title",
      label: "Title",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
      searchable: true,
      placeholder: "Enter article title",
    },
    {
      name: "slug",
      label: "Slug",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "article-url-slug",
      helpText: "URL-friendly version of the title",
    },
    {
      name: "content",
      label: "Content",
      type: "text",
      required: true,
      showInList: false,
      showInShow: true,
      showInForm: true,
      rows: 10,
      placeholder: "Write your article content here...",
    },
    {
      name: "excerpt",
      label: "Excerpt",
      type: "text",
      showInList: false,
      showInShow: true,
      showInForm: true,
      rows: 3,
      placeholder: "Short summary of the article",
    },
    {
      name: "isPublished",
      label: "Status",
      type: "boolean",
      required: false,
      showInList: true,
      showInShow: true,
      showInForm: true,
      render: (value) => {
        const isPublished = Boolean(value);
        return (
          <span
            class={`badge ${isPublished ? "badge-success" : "badge-warning"}`}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
        );
      },
    },
    {
      name: "authorId",
      label: "Author ID",
      type: "number",
      required: false,
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
};
