
// Define a custom error class for Firestore permission errors.
export class FirestorePermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirestorePermissionError';
    // By setting the prototype, we ensure 'instanceof' checks work correctly.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
