import { Injectable } from '@angular/core';

export interface DbConnection {
  id: string;
  name: string;
  type: DbType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export type DbType = 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlserver';

// MongoDB specific
export type MongoOperation = 'find' | 'findOne' | 'count' | 'aggregate' | 'insertOne' | 'updateOne' | 'deleteOne';

export interface MongoQuery {
  collection: string;
  operation: MongoOperation;
  filter: string;
  update?: string;      // Para updateOne
  document?: string;    // Para insertOne
  pipeline?: string;    // Para aggregate
  limit?: number;
  sort?: string;
}

export const MONGO_OPERATIONS: { value: MongoOperation; label: string; hasFilter: boolean; extra?: string }[] = [
  { value: 'find', label: 'find()', hasFilter: true },
  { value: 'findOne', label: 'findOne()', hasFilter: true },
  { value: 'count', label: 'countDocuments()', hasFilter: true },
  { value: 'aggregate', label: 'aggregate()', hasFilter: false, extra: 'pipeline' },
  { value: 'insertOne', label: 'insertOne()', hasFilter: false, extra: 'document' },
  { value: 'updateOne', label: 'updateOne()', hasFilter: true, extra: 'update' },
  { value: 'deleteOne', label: 'deleteOne()', hasFilter: true },
];

export interface DbTypeConfig {
  label: string;
  defaultPort: number;
  icon: string;
  buildCommand: (conn: DbConnection, query: string) => string;
}

@Injectable({
  providedIn: 'root'
})
export class DbConnectionsService {
  private readonly STORAGE_KEY = 'jttb-db-connections';

  readonly dbTypes: Record<DbType, DbTypeConfig> = {
    postgresql: {
      label: 'PostgreSQL (beta)',
      defaultPort: 5432,
      icon: '🐘',
      buildCommand: (conn, query) => {
        let cmd = `PGPASSWORD='${conn.password}' psql -h ${conn.host} -p ${conn.port} -U ${conn.username}`;
        if (conn.database) cmd += ` -d ${conn.database}`;
        if (query) cmd += ` -c "${this.escapeQuery(query)}"`;
        return cmd;
      }
    },
    mysql: {
      label: 'MySQL (beta)',
      defaultPort: 3306,
      icon: '🐬',
      buildCommand: (conn, query) => {
        let cmd = `mysql -h ${conn.host} -P ${conn.port} -u ${conn.username} -p'${conn.password}'`;
        if (conn.database) cmd += ` ${conn.database}`;
        if (query) cmd += ` -e "${this.escapeQuery(query)}"`;
        return cmd;
      }
    },
    mongodb: {
      label: 'MongoDB',
      defaultPort: 27017,
      icon: '🍃',
      buildCommand: (conn, query) => {
        // Usa mongocli (cliente Node.js propio)
        let uri = `mongodb://`;
        if (conn.username && conn.password) {
          // URL encode para caracteres especiales en password
          const user = encodeURIComponent(conn.username);
          const pass = encodeURIComponent(conn.password);
          uri += `${user}:${pass}@`;
        }
        uri += `${conn.host}:${conn.port}`;
        if (conn.database) uri += `/${conn.database}`;
        // authSource=admin para autenticación
        uri += '?authSource=admin';
        if (query) {
          return `mongocli "${uri}" "${this.escapeQuery(query)}"`;
        }
        return `mongocli "${uri}" "db.test.find({}).limit(1).toArray()"`;
      }
    },
    redis: {
      label: 'Redis (beta)',
      defaultPort: 6379,
      icon: '🔴',
      buildCommand: (conn, query) => {
        let cmd = `redis-cli -h ${conn.host} -p ${conn.port}`;
        if (conn.password) cmd += ` -a '${conn.password}'`;
        if (query) cmd += ` ${query}`;
        return cmd;
      }
    },
    sqlserver: {
      label: 'SQL Server',
      defaultPort: 1433,
      icon: '🔷',
      buildCommand: (conn, query) => {
        let tsql = `tsql -H ${conn.host} -p ${conn.port} -U ${conn.username} -P '${conn.password}'`;
        if (conn.database) tsql += ` -D ${conn.database}`;
        if (query) {
          return `echo "${this.escapeQuery(query)}" | ${tsql}`;
        }
        return tsql;
      }
    }
  };

  private escapeQuery(query: string): string {
    return query.replace(/"/g, '\\"').replace(/\$/g, '\\$');
  }

  getConnections(): DbConnection[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  saveConnection(conn: DbConnection): void {
    const connections = this.getConnections();
    const index = connections.findIndex(c => c.id === conn.id);
    if (index >= 0) {
      connections[index] = conn;
    } else {
      conn.id = this.generateId();
      connections.push(conn);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connections));
  }

  deleteConnection(id: string): void {
    const connections = this.getConnections().filter(c => c.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connections));
  }

  buildCommand(conn: DbConnection, query: string): string {
    const config = this.dbTypes[conn.type];
    return config.buildCommand(conn, query);
  }

  getDbTypeConfig(type: DbType): DbTypeConfig {
    return this.dbTypes[type];
  }

  getDbTypesList(): { type: DbType; config: DbTypeConfig }[] {
    return Object.entries(this.dbTypes).map(([type, config]) => ({
      type: type as DbType,
      config
    }));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  buildMongoQuery(mq: MongoQuery): string {
    if (!mq.collection) return '';

    const filter = mq.filter || '{}';
    let query = `db.${mq.collection}.`;

    switch (mq.operation) {
      case 'find':
        query += `find(${filter})`;
        if (mq.sort) query += `.sort(${mq.sort})`;
        if (mq.limit) query += `.limit(${mq.limit})`;
        query += '.toArray()';
        break;
      case 'findOne':
        query += `findOne(${filter})`;
        break;
      case 'count':
        query += `countDocuments(${filter})`;
        break;
      case 'aggregate':
        query += `aggregate(${mq.pipeline || '[]'}).toArray()`;
        break;
      case 'insertOne':
        query += `insertOne(${mq.document || '{}'})`;
        break;
      case 'updateOne':
        query += `updateOne(${filter}, ${mq.update || '{}'})`;
        break;
      case 'deleteOne':
        query += `deleteOne(${filter})`;
        break;
    }

    return query;
  }

  buildMongoCommand(conn: DbConnection, mq: MongoQuery): string {
    const query = this.buildMongoQuery(mq);
    return this.buildCommand(conn, query);
  }
}
