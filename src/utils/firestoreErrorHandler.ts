import { supabase } from '../supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export async function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  const msg = error instanceof Error ? error.message : String(error);
  console.error('DB Error:', JSON.stringify({
    error: msg,
    operationType,
    path,
    auth: user ? { id: user.id, email: user.email } : null,
  }));
}
