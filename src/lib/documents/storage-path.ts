export function buildStoragePath(userId: string, documentId: string): string {
  return `${userId}/${documentId}.pdf`;
}
