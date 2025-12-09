/**
 * CSV Import Service
 * Handles importing contacts from CSV files (LinkedIn, custom lists, etc.)
 */

import { Contact, CreateContactInput } from '../types/Contact';
import * as contactService from './contactService';
import Papa from 'papaparse';

export interface CSVImportResult {
  success: number;
  failed: number;
  duplicates: number;
  contacts: Contact[];
  errors: string[];
}

/**
 * Parse CSV file and return rows
 */
export function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * Map CSV row to contact input
 * Supports multiple CSV formats (LinkedIn, generic, etc.)
 */
function mapCSVRowToContact(row: any): CreateContactInput | null {
  // Try LinkedIn format first
  if (row['First Name'] || row['Last Name'] || row['Email Address']) {
    return {
      name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
      email: row['Email Address'] || undefined,
      company: row['Company'] || undefined,
      job_title: row['Position'] || row['Title'] || undefined,
      linkedin_url: row['Profile URL'] || row['LinkedIn'] || undefined,
      phone: row['Phone'] || row['Phone Number'] || undefined,
      source: 'linkedin',
    };
  }

  // Try generic format
  if (row.name || row.email) {
    return {
      name: row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      email: row.email || undefined,
      company: row.company || row.organization || undefined,
      job_title: row.jobTitle || row.title || row.position || undefined,
      phone: row.phone || row.phoneNumber || undefined,
      linkedin_url: row.linkedin || row.linkedinUrl || row['LinkedIn URL'] || undefined,
      notes: row.notes || row.description || undefined,
      source: 'manual',
    };
  }

  return null;
}

/**
 * Check if contact already exists (by email or name+company)
 */
async function findDuplicateContact(contactInput: CreateContactInput): Promise<Contact | null> {
  try {
    const contacts = await contactService.fetchContacts();
    
    // Check by email first
    if (contactInput.email) {
      const byEmail = contacts.find((c) => c.email?.toLowerCase() === contactInput.email?.toLowerCase());
      if (byEmail) return byEmail;
    }
    
    // Check by name + company
    if (contactInput.name && contactInput.company) {
      const byNameCompany = contacts.find(
        (c) =>
          c.name.toLowerCase() === contactInput.name.toLowerCase() &&
          c.company?.toLowerCase() === contactInput.company?.toLowerCase()
      );
      if (byNameCompany) return byNameCompany;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return null;
  }
}

/**
 * Import contacts from CSV file
 */
export async function importContactsFromCSV(file: File): Promise<CSVImportResult> {
  const result: CSVImportResult = {
    success: 0,
    failed: 0,
    duplicates: 0,
    contacts: [],
    errors: [],
  };

  try {
    const rows = await parseCSV(file);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const contactInput = mapCSVRowToContact(row);
        
        if (!contactInput || !contactInput.name) {
          result.failed++;
          result.errors.push(`Row ${i + 2}: Missing name field`);
          continue;
        }
        
        // Check for duplicates
        const duplicate = await findDuplicateContact(contactInput);
        if (duplicate) {
          result.duplicates++;
          result.contacts.push(duplicate);
          continue;
        }
        
        // Create contact
        const contact = await contactService.createContact(contactInput);
        result.success++;
        result.contacts.push(contact);
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Row ${i + 2}: ${error.message || 'Unknown error'}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`CSV parsing error: ${error.message}`);
  }

  return result;
}

/**
 * Export contacts to CSV
 */
export function exportContactsToCSV(contacts: Contact[]): string {
  const rows = contacts.map((contact) => ({
    'First Name': contact.name.split(' ')[0] || '',
    'Last Name': contact.name.split(' ').slice(1).join(' ') || '',
    'Email Address': contact.email || '',
    'Company': contact.company || '',
    'Position': contact.job_title || '',
    'Phone': contact.phone || '',
    'LinkedIn': contact.linkedin_url || '',
    'Notes': contact.notes || '',
    'Lead Score': contact.lead_score || 0,
    'Temperature': contact.temperature || '',
    'Last Contact': contact.last_contact_date
      ? new Date(contact.last_contact_date).toISOString().split('T')[0]
      : '',
  }));

  return Papa.unparse(rows);
}

