/**
 * Enquiry Service
 * Extends BaseService for standard CRUD + custom methods
 */

import { BaseService } from "@/lib/base-service.ts";
import type {
  BulkDeleteResponse,
  BulkSpamResponse,
  Enquiry,
} from "./enquiry.types.ts";

export class EnquiryService extends BaseService<Enquiry> {
  constructor() {
    super("/ts-admin/enquiries");
  }

  /**
   * Bulk delete multiple enquiries
   */
  bulkDelete(ids: number[]): Promise<BulkDeleteResponse> {
    return this.client.post<BulkDeleteResponse>(
      `${this.basePath}/bulk-delete`,
      { ids },
    );
  }

  /**
   * Bulk mark enquiries as spam
   */
  bulkMarkAsSpam(ids: number[]): Promise<BulkSpamResponse> {
    return this.client.post<BulkSpamResponse>(
      `${this.basePath}/bulk-spam`,
      { ids },
    );
  }
}

export const enquiryService = new EnquiryService();
