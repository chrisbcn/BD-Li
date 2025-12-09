import { useState, useEffect, useCallback } from 'react';
import { Contact, CreateContactInput, UpdateContactInput } from '../types/Contact';
import * as contactService from '../services/contactService';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedContacts = await contactService.fetchContacts();
      setContacts(fetchedContacts);
    } catch (err: any) {
      setError(err.message);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const addContact = useCallback(async (contactInput: CreateContactInput) => {
    try {
      const newContact = await contactService.createContact(contactInput);
      setContacts((prev) => [newContact, ...prev]);
      return newContact;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateContact = useCallback(async (id: string, updates: UpdateContactInput) => {
    try {
      const updatedContact = await contactService.updateContact(id, updates);
      setContacts((prev) =>
        prev.map((contact) => (contact.id === id ? updatedContact : contact))
      );
      return updatedContact;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    try {
      await contactService.deleteContact(id);
      setContacts((prev) => prev.filter((contact) => contact.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getContactsToReconnect = useCallback(async () => {
    try {
      return await contactService.getContactsToReconnect();
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  return {
    contacts,
    isLoading,
    error,
    addContact,
    updateContact,
    deleteContact,
    getContactsToReconnect,
    refreshContacts: loadContacts,
  };
}

