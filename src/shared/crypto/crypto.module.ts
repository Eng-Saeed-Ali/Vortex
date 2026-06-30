/**
 * Vortex Pipeline - Crypto Module
 * 
 * Provides encryption services for sensitive data at rest.
 * Exports EncryptionService globally for use across the application.
 * 
 * @module shared/crypto
 * @version 1.0.0
 */

import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class CryptoModule {}