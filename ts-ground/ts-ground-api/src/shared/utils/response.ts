export class ApiResponse {
  static success<T>(data: T, message = "Success") {
    return {
      status: "success",
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message = "Error",
    data: unknown = null,
    errors: unknown = null,
  ) {
    return {
      status: "error",
      message,
      data,
      errors,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = "Data fetched successfully",
  ) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      status: "success",
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
