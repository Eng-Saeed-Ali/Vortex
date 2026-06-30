/**
 * Vortex Pipeline - Database Module
 * 
 * Global module providing PrismaService for database access.
 * Exports PrismaService for use across all modules.
 * 
 * @module infrastructure/database
 * @version 1.0.0
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}