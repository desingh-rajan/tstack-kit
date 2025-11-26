/**
 * DataTable Actions Island
 * Client-side interactive buttons for table actions
 */

interface DataTableActionsProps {
  entityName: string;
  identifier: string | number;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  singularName: string;
}

export default function DataTableActions(
  {
    entityName,
    identifier,
    canView,
    canEdit,
    canDelete,
    singularName,
  }: DataTableActionsProps,
) {
  const handleDelete = async (e: Event) => {
    e.preventDefault();

    if (
      !confirm(
        `Are you sure you want to delete this ${singularName.toLowerCase()}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/admin/${entityName}/${identifier}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.redirected) {
        globalThis.location.href = response.url;
      } else if (response.status === 303) {
        const location = response.headers.get("Location");
        globalThis.location.href = location || `/admin/${entityName}`;
      } else {
        globalThis.location.href = `/admin/${entityName}`;
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div class="flex gap-2 justify-end">
      {canView && (
        <a
          href={`/admin/${entityName}/${identifier}`}
          class="btn btn-sm btn-info btn-ghost"
        >
          View
        </a>
      )}
      {canEdit && (
        <a
          href={`/admin/${entityName}/${identifier}/edit`}
          class="btn btn-sm btn-warning btn-ghost"
        >
          Edit
        </a>
      )}
      {canDelete && (
        <button
          type="button"
          class="btn btn-sm btn-error btn-ghost"
          onClick={handleDelete}
        >
          Delete
        </button>
      )}
    </div>
  );
}
