import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DbConnectionsService, DbConnection, DbType, MongoQuery, MongoOperation, MONGO_OPERATIONS } from '../../services/db-connections.service';

@Component({
  selector: 'app-db-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './db-builder.component.html',
  styleUrl: './db-builder.component.css'
})
export class DbBuilderComponent {
  @Output() close = new EventEmitter<void>();
  @Output() execute = new EventEmitter<string>();

  // View state
  view: 'list' | 'form' = 'list';
  savedConnections: DbConnection[] = [];

  // Form state
  selectedType: DbType = 'postgresql';
  connection: DbConnection = this.createEmptyConnection();
  query = '';
  generatedCommand = '';
  showPassword = false;

  // MongoDB specific
  mongoOperations = MONGO_OPERATIONS;
  mongoQuery: MongoQuery = this.createEmptyMongoQuery();

  constructor(public dbService: DbConnectionsService) {
    this.loadConnections();
  }

  loadConnections(): void {
    this.savedConnections = this.dbService.getConnections();
  }

  createEmptyConnection(): DbConnection {
    return {
      id: '',
      name: '',
      type: 'postgresql',
      host: '',
      port: this.dbService.getDbTypeConfig('postgresql').defaultPort,
      username: '',
      password: '',
      database: '',
      ssl: false
    };
  }

  createEmptyMongoQuery(): MongoQuery {
    return {
      collection: '',
      operation: 'find',
      filter: '{}',
      limit: 10
    };
  }

  newConnection(): void {
    this.connection = this.createEmptyConnection();
    this.connection.type = this.selectedType;
    this.connection.port = this.dbService.getDbTypeConfig(this.selectedType).defaultPort;
    this.query = '';
    this.mongoQuery = this.createEmptyMongoQuery();
    this.generatedCommand = '';
    this.view = 'form';
  }

  editConnection(conn: DbConnection): void {
    this.connection = { ...conn };
    this.selectedType = conn.type;
    this.query = '';
    this.mongoQuery = this.createEmptyMongoQuery();
    this.generatedCommand = '';
    this.view = 'form';
  }

  deleteConnection(conn: DbConnection): void {
    if (confirm(`Delete connection "${conn.name}"?`)) {
      this.dbService.deleteConnection(conn.id);
      this.loadConnections();
    }
  }

  onTypeChange(): void {
    this.connection.type = this.selectedType;
    this.connection.port = this.dbService.getDbTypeConfig(this.selectedType).defaultPort;
    this.query = '';
    this.mongoQuery = this.createEmptyMongoQuery();
    this.updateCommand();
  }

  updateCommand(): void {
    if (!this.connection.host) {
      this.generatedCommand = '';
      return;
    }

    if (this.selectedType === 'mongodb') {
      this.generatedCommand = this.dbService.buildMongoCommand(this.connection, this.mongoQuery);
    } else {
      this.generatedCommand = this.dbService.buildCommand(this.connection, this.query);
    }
  }

  getSelectedMongoOperation() {
    return MONGO_OPERATIONS.find(op => op.value === this.mongoQuery.operation);
  }

  saveConnection(): void {
    if (!this.connection.name) {
      this.connection.name = `${this.connection.type}@${this.connection.host}`;
    }
    this.dbService.saveConnection(this.connection);
    this.loadConnections();
  }

  runQuery(): void {
    if (this.generatedCommand) {
      this.execute.emit(this.generatedCommand);
      this.close.emit();
    }
  }

  copyCommand(): void {
    navigator.clipboard.writeText(this.generatedCommand);
  }

  backToList(): void {
    this.view = 'list';
  }

  onClose(): void {
    this.close.emit();
  }

  quickConnect(conn: DbConnection): void {
    this.editConnection(conn);
  }
}
