import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

// Define the interface for the typed event emitter.
interface TypedEventEmitter {
  on(event: 'permission-error', listener: (error: FirestorePermissionError) => void): this;
  off(event: 'permission-error', listener: (error: FirestorePermissionError) => void): this;
  emit(event: 'permission-error', error: FirestorePermissionError): boolean;
}

// Create an instance of EventEmitter and cast it to our typed interface.
export const errorEmitter: TypedEventEmitter = new EventEmitter();
