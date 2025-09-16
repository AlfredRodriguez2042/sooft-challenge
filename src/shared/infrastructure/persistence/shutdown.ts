import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TypeormShutdownService implements BeforeApplicationShutdown {
  private readonly logger = new Logger(TypeormShutdownService.name);
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async beforeApplicationShutdown(signal?: string) {
    this.logger.log(
      `Recibida señal ${signal ?? 'app.close()'}: cerrando TypeORM...`,
    );
    if (this.dataSource.isInitialized) {
      try {
        await this.dataSource.destroy();
        this.logger.log('Conexión TypeORM cerrada correctamente');
      } catch (err) {
        this.logger.error('Error al cerrar TypeORM', err as Error);
      }
    }
  }
}
