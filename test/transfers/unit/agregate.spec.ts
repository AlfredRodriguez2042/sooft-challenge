import { Transfer } from '../../../src/transfers/domain/aggregates/transfer';
import { TransferCompletedEvent } from '../../../src/transfers/domain/events/transferCompleted';
import { TransferCreatedEvent } from '../../../src/transfers/domain/events/transferCreated';
import { TransferRecord } from '../../../src/transfers/domain/ports/transfer';

describe('Transfer Aggregate', () => {
  const mockTransferRecord: TransferRecord = {
    id: 'transfer-123',
    debitAccountId: 'acc-debit',
    creditAccountId: 'acc-credit',
    amount_minor: 1000,
    currency: 'USD',
    status: 'PENDING',
    idempotencyKey: 'idemp-123',
    createdAt: new Date().toISOString() as unknown as Date,
    creditCompanyId: '123',
    debitCompanyId: '234',
    metadata: {},
  };

  describe('create', () => {
    it('should create a transfer with PENDING status and emit TransferCreatedEvent', () => {
      // Act
      const transfer = Transfer.create(mockTransferRecord);

      // Assert - Verificar estado interno
      expect(transfer['_id']).toBe(mockTransferRecord.id);
      expect(transfer['_status']).toBe('PENDING');

      // Verificar que se emitió el evento correcto
      const uncommittedEvents = transfer.getUncommittedEvents();
      expect(uncommittedEvents).toHaveLength(1);
      expect(uncommittedEvents[0]).toBeInstanceOf(TransferCreatedEvent);
    });

    it('should initialize with correct data from the transfer record', () => {
      // Act
      const transfer = Transfer.create(mockTransferRecord);

      // Assert
      expect(transfer['_id']).toBe(mockTransferRecord.id);
      expect(transfer.status).toBe('PENDING');
    });
  });

  describe('complete', () => {
    it('should complete a transfer and emit TransferCompletedEvent', () => {
      // Arrange
      const transfer = Transfer.create(mockTransferRecord);
      transfer.commit(); // Limpiar eventos pendientes del create

      // Act
      transfer.complete();

      // Assert
      expect(transfer.status).toBe('COMPLETED');

      // Verificar que se emitió el evento correcto
      const uncommittedEvents = transfer.getUncommittedEvents();
      expect(uncommittedEvents).toHaveLength(1);
      expect(uncommittedEvents[0]).toBeInstanceOf(TransferCompletedEvent);

      const event = uncommittedEvents[0] as TransferCompletedEvent;
      expect(event.status).toBe('COMPLETED');
    });

    it('should throw error when completing transfer without ID', () => {
      // Arrange
      const transfer = new Transfer(); // Transfer sin ID

      // Act & Assert
      expect(() => transfer.complete()).toThrow('Transfer ID no asignado aún.');
    });

    it('should not generate duplicate events when completing already completed transfer', () => {
      // Arrange
      const transfer = Transfer.create(mockTransferRecord);
      transfer.complete(); // Completar primera vez
      transfer.commit(); // Limpiar eventos

      // Act
      transfer.complete(); // Intentar completar nuevamente

      // Assert - No debería generar nuevo evento
      const uncommittedEvents = transfer.getUncommittedEvents();
      expect(uncommittedEvents).toHaveLength(0);
      expect(transfer.status).toBe('COMPLETED');
    });
  });

  describe('status getter', () => {
    it('should return current status', () => {
      // Arrange
      const transfer = Transfer.create(mockTransferRecord);

      // Act & Assert
      expect(transfer.status).toBe('PENDING');

      // Cambiar estado y verificar
      transfer.complete();
      expect(transfer.status).toBe('COMPLETED');
    });
  });

  describe('event sourcing behavior', () => {
    it('should reconstruct state correctly when events are applied (simulación de rehidratación)', () => {
      // Esta prueba simula cómo el framework CQRS reconstruiría el agregado
      // SIN llamar directamente a los métodos privados

      // Crear transferencia y aplicar eventos en orden
      const transfer1 = Transfer.create(mockTransferRecord);
      expect(transfer1.status).toBe('PENDING');

      const transfer2 = Transfer.create(mockTransferRecord);
      transfer2.complete();
      expect(transfer2.status).toBe('COMPLETED');
    });

    it('should maintain consistency after multiple operations', () => {
      const transfer = Transfer.create(mockTransferRecord);

      // Verificar estado inicial
      expect(transfer.status).toBe('PENDING');
      expect(transfer['_id']).toBe(mockTransferRecord.id);

      // Completar y verificar estado final
      transfer.complete();
      expect(transfer.status).toBe('COMPLETED');

      // Verificar eventos emitidos
      const events = transfer.getUncommittedEvents();
      expect(events).toHaveLength(2); // Created + Completed
      expect(events[0]).toBeInstanceOf(TransferCreatedEvent);
      expect(events[1]).toBeInstanceOf(TransferCompletedEvent);
    });
  });

  describe('business rules validation', () => {
    it('should handle edge cases for amount values', () => {
      // Test para montos límite
      const zeroAmountTransfer = {
        ...mockTransferRecord,
        amount_minor: 0,
      };

      const transfer = Transfer.create(zeroAmountTransfer);
      expect(() => transfer.complete()).not.toThrow();
      expect(transfer.status).toBe('COMPLETED');
    });
  });
});
