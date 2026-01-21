import { Injectable } from '@nestjs/common';
import { PersonsService } from './persons.service';
import * as xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';
import { LeadSource, PersonType } from '@prisma/client';

@Injectable()
export class ImportExportService {
    constructor(private readonly personsService: PersonsService) { }

    async importFromCsv(buffer: Buffer, tenantId: string): Promise<any> {
        const records = parse(buffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        return this.processRecords(records, tenantId);
    }

    async importFromExcel(buffer: Buffer, tenantId: string): Promise<any> {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        return this.processRecords(records, tenantId);
    }

    private async processRecords(records: any[], tenantId: string): Promise<any> {
        let imported = 0;
        let skipped = 0;
        const errors = [];

        for (const record of records) {
            try {
                // Normalize keys (handle different casing or slight variations)
                const phone = record.phone || record.telefono || record.Phone || record.Telefono;
                const name = record.fullName || record.nombre || record.Name || record.Nombre;
                const email = record.email || record.Email || record.correo;

                if (!phone) {
                    skipped++;
                    continue;
                }

                // Use findOrCreate logic or custom import logic
                const person = await this.personsService.findOrCreate(phone.toString(), tenantId, name);

                // Update additional fields if it was just created or if we want to enrich
                if (email) {
                    await this.personsService.updateQuality(person.id, record.quality || 'COLD' as any);
                    // We could add more field updates here
                }

                imported++;
            } catch (error) {
                errors.push({ record, error: error.message });
            }
        }

        return { imported, skipped, errors };
    }

    async exportToExcel(persons: any[]): Promise<Buffer> {
        const data = persons.map(p => ({
            ID: p.id,
            'Full Name': p.fullName || '',
            Phone: p.phone,
            Email: p.email || '',
            Type: p.type,
            Source: p.source,
            Status: p.status,
            'Pipeline Stage': p.pipelineStage?.displayName || '',
            'Created At': p.createdAt,
        }));

        const ws = xlsx.utils.json_to_sheet(data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Persons');

        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
}
