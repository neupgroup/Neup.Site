import { db } from '@/lib/db';
import { asJson, stripUndefined, toDate } from '@/lib/db-utils';

type CollectionRef = {
  kind: 'collection';
  path: string;
};

type DocRef = {
  kind: 'doc';
  path: string;
  id: string;
};

type WhereClause = {
  kind: 'where';
  field: string;
  op: '==';
  value: unknown;
};

type OrderByClause = {
  kind: 'orderBy';
  field: string;
  direction: 'asc' | 'desc';
};

type LimitClause = {
  kind: 'limit';
  count: number;
};

type StartAfterClause = {
  kind: 'startAfter';
  id?: string;
};

type QueryClause = WhereClause | OrderByClause | LimitClause | StartAfterClause;

type QueryRef = {
  kind: 'query';
  path: string;
  clauses: QueryClause[];
};

type FirestoreLikeRef = CollectionRef | QueryRef;

type CollectionConfig = {
  model: string;
  jsonFields?: string[];
  include?: Record<string, unknown>;
};

const SERVER_TIMESTAMP_SENTINEL = '__server_timestamp__';

const COLLECTIONS: Record<string, CollectionConfig> = {
  // Backwards-compatible alias: historically called "sites".
  // Use "artifacts" going forward.
  sites: {
    model: 'artifact',
    jsonFields: ['socialProfiles', 'contactEmail', 'contactPhone', 'modules', 'theme', 'icons', 'domains'],
  },
  artifacts: {
    model: 'artifact',
    jsonFields: ['socialProfiles', 'contactEmail', 'contactPhone', 'modules', 'theme', 'icons', 'domains'],
  },
  pages: {
    model: 'page',
    jsonFields: ['elements'],
  },
  paths: {
    model: 'pagePath',
  },
  sections: {
    model: 'section',
  },
  templates: {
    model: 'template',
    jsonFields: ['usableOn', 'content'],
  },
  sources: {
    model: 'dataSource',
    jsonFields: ['methods', 'headers', 'data'],
  },
  page_data_sources: {
    model: 'pageDataSourceBinding',
  },
  datalists: {
    model: 'datalist',
  },
  redirects: {
    model: 'redirect',
  },
  environments: {
    model: 'environmentVariable',
  },
  structure: {
    model: 'siteStructure',
    jsonFields: ['structure'],
  },
  deployments: {
    model: 'deployment',
    jsonFields: ['structure', 'theme', 'redirects', 'siteProfile', 'environments'],
  },
  servers: {
    model: 'server',
    jsonFields: ['portsOpen'],
  },
  allocations: {
    model: 'allocation',
  },
  serverLogs: {
    model: 'serverLog',
  },
  serverCommands: {
    model: 'serverCommand',
    jsonFields: ['parameters', 'nextCommands'],
  },
  codeFiles: {
    model: 'codeFile',
  },
  linked_accounts: {
    model: 'linkedAccount',
  },
  api_tokens: {
    model: 'apiToken',
  },
  teams: {
    model: 'team',
  },
  members: {
    model: 'member',
    include: {
      teams: {
        select: {
          id: true,
        },
      },
    },
    jsonFields: ['permissions'],
  },
  hiring: {
    model: 'jobPosting',
    jsonFields: ['qualifications'],
  },
  applicants: {
    model: 'applicant',
  },
  errors: {
    model: 'errorLog',
  },
  appBaseBackups: {
    model: 'appBaseBackup',
  },
  news: {
    model: 'newsArticle',
  },
  syncer_log: {
    model: 'syncerLog',
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Timestamp);
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (Array.isArray(base) || Array.isArray(patch)) {
    return patch as T;
  }

  if (isPlainObject(base) && isPlainObject(patch)) {
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      merged[key] =
        key in merged ? deepMerge(merged[key], value) : value;
    }
    return merged as T;
  }

  return patch as T;
}

function replaceServerTimestamps(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(replaceServerTimestamps);
  }

  if (isPlainObject(value)) {
    if (value[SERVER_TIMESTAMP_SENTINEL] === true) {
      return new Date();
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, replaceServerTimestamps(entryValue)])
    );
  }

  return value;
}

function wrapDates(value: unknown): unknown {
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  if (Array.isArray(value)) {
    return value.map(wrapDates);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, wrapDates(entryValue)])
    );
  }

  return value;
}

function normalizeFieldName(field: string): string {
  if (field === '__name__') {
    return 'id';
  }

  if (field === 'authorization_info.provider_user_id') {
    return 'providerUserId';
  }

  return field;
}

function resolveCollection(path: string) {
  const applicantsMatch = path.match(/^hiring\/([^/]+)\/applicants$/);
  if (applicantsMatch) {
    return {
      name: 'applicants',
      fixedWhere: { jobId: applicantsMatch[1] },
      fixedData: { jobId: applicantsMatch[1] },
    };
  }

  return {
    name: path,
    fixedWhere: {},
    fixedData: {},
  };
}

function getConfig(path: string) {
  const resolved = resolveCollection(path);
  const config = COLLECTIONS[resolved.name];

  if (!config) {
    throw new Error(`Unsupported collection: ${path}`);
  }

  return { ...resolved, config };
}

function toPrismaData(path: string, value: Record<string, unknown>) {
  const { name, config } = getConfig(path);
  const data = stripUndefined({ ...(replaceServerTimestamps(value) as Record<string, unknown>) });

  delete data.id;

  if (name === 'linked_accounts' && isPlainObject(data.authorization_info)) {
    const authorizationInfo = data.authorization_info as Record<string, unknown>;
    data.accessToken = authorizationInfo.access_token;
    data.refreshToken = authorizationInfo.refresh_token;
    data.scope = authorizationInfo.scope;
    data.providerUserId = authorizationInfo.provider_user_id;
    data.providerUsername = authorizationInfo.provider_username;
    delete data.authorization_info;
  }

  if (config.jsonFields) {
    for (const field of config.jsonFields) {
      if (field in data && data[field] !== undefined) {
        data[field] = data[field] === null ? null : asJson(data[field]);
      }
    }
  }

  const dateFields = [
    'createdAt',
    'updatedAt',
    'createdOn',
    'allocatedOn',
    'authorized_on',
    'created_on',
    'publishedAt',
    'initiatedAt',
    'completedAt',
    'attemptedOn',
    'timestamp',
    'backedUpAt',
    'expiresOn',
    'lastUsed',
    'appliedAt',
  ];

  for (const field of dateFields) {
    if (field in data) {
      data[field] = toDate(data[field] as string | Date | null);
    }
  }

  if (name === 'members' && Array.isArray(data.teamIds)) {
    data.teams = {
      set: [],
      connect: (data.teamIds as string[]).filter(Boolean).map((id) => ({ id })),
    };
    delete data.teamIds;
  }

  return stripUndefined(data);
}

function fromPrismaRecord(path: string, value: Record<string, unknown>) {
  const { name } = getConfig(path);
  const data: Record<string, unknown> = { ...value };

  if (name === 'linked_accounts') {
    data.authorization_info = {
      access_token: data.accessToken,
      refresh_token: data.refreshToken ?? null,
      scope: data.scope,
      provider_user_id: data.providerUserId,
      provider_username: data.providerUsername,
    };
    delete data.accessToken;
    delete data.refreshToken;
    delete data.scope;
    delete data.providerUserId;
    delete data.providerUsername;
  }

  if (name === 'members') {
    const teams = Array.isArray(data.teams) ? (data.teams as Array<{ id: string }>) : [];
    data.teamIds = teams.map((team) => team.id);
    delete data.teams;
  }

  return wrapDates(data);
}

function makeDocSnapshot(path: string, record: Record<string, unknown> | null): any {
  return {
    id: (record?.id as string) || '',
    ref: record?.id ? doc(null, path, record.id as string) : undefined,
    exists: () => Boolean(record),
    data: () => (record ? (fromPrismaRecord(path, record) as any) : undefined),
  };
}

async function findMany(path: string, clauses: QueryClause[] = []) {
  const { name, fixedWhere, config } = getConfig(path);
  const delegate = (db as Record<string, any>)[config.model];

  const whereClauses = clauses.filter((clause): clause is WhereClause => clause.kind === 'where');
  const orderClauses = clauses.filter((clause): clause is OrderByClause => clause.kind === 'orderBy');
  const limitClause = clauses.find((clause): clause is LimitClause => clause.kind === 'limit');
  const startAfterClause = clauses.find((clause): clause is StartAfterClause => clause.kind === 'startAfter');

  const where = {
    ...fixedWhere,
    ...Object.fromEntries(whereClauses.map((clause) => [normalizeFieldName(clause.field), clause.value])),
  };

  let records = await delegate.findMany({
    where,
    orderBy: orderClauses.length
      ? orderClauses.map((clause) => ({ [normalizeFieldName(clause.field)]: clause.direction }))
      : undefined,
    include: config.include,
  });

  if (startAfterClause?.id) {
    const index = records.findIndex((record: Record<string, unknown>) => record.id === startAfterClause.id);
    if (index >= 0) {
      records = records.slice(index + 1);
    }
  }

  if (limitClause) {
    records = records.slice(0, limitClause.count);
  }

  return records;
}

export class Timestamp {
  constructor(private readonly value: Date) {}

  toDate() {
    return this.value;
  }

  static fromDate(value: Date) {
    return new Timestamp(value);
  }
}

export type DocumentSnapshot<T = any> = {
  id: string;
  ref?: DocRef;
  exists: () => boolean;
  data: () => T | undefined;
};

export function getFirestore() {
  return db;
}

export function collection(_firestore: unknown, path: string): any {
  return { kind: 'collection', path };
}

export function doc(_firestore: unknown, path: string, id: string): any {
  return { kind: 'doc', path, id };
}

export function where(field: string, op: '==', value: unknown): WhereClause {
  return { kind: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): OrderByClause {
  return { kind: 'orderBy', field, direction };
}

export function limit(count: number): LimitClause {
  return { kind: 'limit', count };
}

export function startAfter(snapshot?: { id?: string }): StartAfterClause {
  return { kind: 'startAfter', id: snapshot?.id };
}

export function query(ref: FirestoreLikeRef, ...clauses: QueryClause[]): any {
  return {
    kind: 'query',
    path: ref.path,
    clauses: ref.kind === 'query' ? [...ref.clauses, ...clauses] : clauses,
  };
}

export function serverTimestamp() {
  return {
    [SERVER_TIMESTAMP_SENTINEL]: true,
  };
}

export async function addDoc(ref: CollectionRef, value: Record<string, unknown>): Promise<any> {
  const { fixedData, config } = getConfig(ref.path);
  const delegate = (db as Record<string, any>)[config.model];
  const data = toPrismaData(ref.path, { ...fixedData, ...value });
  const record = await delegate.create({ data });

  return {
    id: record.id,
  };
}

export async function getDoc(ref: DocRef): Promise<any> {
  const { fixedWhere, config } = getConfig(ref.path);
  const delegate = (db as Record<string, any>)[config.model];
  const record = await delegate.findFirst({
    where: {
      id: ref.id,
      ...fixedWhere,
    },
    include: config.include,
  });

  return makeDocSnapshot(ref.path, record);
}

export async function getDocs(ref: FirestoreLikeRef): Promise<any> {
  const records = await findMany(ref.path, ref.kind === 'query' ? ref.clauses : []);
  const docs = records.map((record: Record<string, unknown>) => makeDocSnapshot(ref.path, record));

  return {
    docs,
    empty: docs.length === 0,
    forEach(callback: (snapshot: ReturnType<typeof makeDocSnapshot>) => void) {
      docs.forEach(callback);
    },
  };
}

export async function setDoc(ref: DocRef, value: Record<string, unknown>, options?: { merge?: boolean }): Promise<void> {
  const { fixedData, config } = getConfig(ref.path);
  const delegate = (db as Record<string, any>)[config.model];
  const existing = await delegate.findUnique({
    where: { id: ref.id },
    include: config.include,
  });

  let finalValue = { ...fixedData, ...value };
  if (options?.merge && existing) {
    finalValue = deepMerge(fromPrismaRecord(ref.path, existing) as Record<string, unknown>, finalValue);
  }

  const data = toPrismaData(ref.path, finalValue);

  if (existing) {
    await delegate.update({
      where: { id: ref.id },
      data,
    });
    return;
  }

  await delegate.create({
    data: {
      id: ref.id,
      ...data,
    },
  });
}

export async function deleteDoc(ref: DocRef) {
  const { config } = getConfig(ref.path);
  const delegate = (db as Record<string, any>)[config.model];
  await delegate.delete({
    where: { id: ref.id },
  });
}

export async function getCountFromServer(ref: FirestoreLikeRef): Promise<any> {
  const records = await findMany(ref.path, ref.kind === 'query' ? ref.clauses : []);

  return {
    data() {
      return {
        count: records.length,
      };
    },
  };
}

export function writeBatch(_firestore?: unknown): any {
  const deletions: DocRef[] = [];

  return {
    delete(ref: DocRef) {
      deletions.push(ref);
    },
    async commit() {
      await Promise.all(deletions.map((ref) => deleteDoc(ref)));
    },
  };
}
