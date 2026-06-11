import { create } from "zustand";
import { encryptData, decryptData, generateChecksum, verifyChecksum } from "@/utils/crypto";
import { getSystemEncryptionKey } from "./authStore";
import { supabase, isSupabaseConfigured } from "@/utils/supabaseClient";
import toast from "react-hot-toast";

const STORAGE_KEY = "dora-encrypted-docs";

export const generateGrupoRegistro = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, "0");
  return `GR-${year}-${random}`;
};

export const useDocumentsStore = create((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,
  integrityWarning: false,

  // ── Acción: Cargar documentos ──────────────────────────────────
  loadDocuments: async () => {
    const encryptionKey = getSystemEncryptionKey();
    if (!encryptionKey) return;

    set({ isLoading: true, error: null, integrityWarning: false });

    // 1. MODO LOCAL (LocalStorage)
    if (!isSupabaseConfigured()) {
      try {
        const encryptedData = localStorage.getItem(STORAGE_KEY);
        if (!encryptedData) {
          set({ documents: [], isLoading: false });
          return;
        }

        const decrypted = decryptData(encryptedData, encryptionKey);
        if (!decrypted) {
          set({ error: "Fallo al desencriptar los datos locales.", isLoading: false });
          return;
        }

        let hasCorruptedData = false;
        decrypted.forEach(doc => {
          if (!verifyChecksum(doc)) {
            hasCorruptedData = true;
          }
        });

        set({ 
          documents: decrypted, 
          integrityWarning: hasCorruptedData,
          isLoading: false 
        });

        if (hasCorruptedData) {
          toast.error("Advertencia: Se detectó alteración en la integridad de algunos documentos locales.");
        }
      } catch (error) {
        console.error(error);
        set({ error: "Error crítico al cargar datos locales.", isLoading: false });
      }
      return;
    }

    // 2. MODO COMPARTIDO (Supabase)
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        set({ documents: [], isLoading: false });
        return;
      }

      const decryptedDocs = [];
      let hasCorruptedData = false;

      for (const row of data) {
        const decryptedDoc = decryptData(row.encrypted_data, encryptionKey);
        if (decryptedDoc) {
          // Asegurar que el estado "eliminado" de la fila coincida con el objeto desencriptado
          decryptedDoc.eliminado = row.eliminado;
          if (!verifyChecksum(decryptedDoc)) {
            hasCorruptedData = true;
          }
          decryptedDocs.push(decryptedDoc);
        } else {
          hasCorruptedData = true;
        }
      }

      set({ 
        documents: decryptedDocs, 
        integrityWarning: hasCorruptedData,
        isLoading: false 
      });

      if (hasCorruptedData) {
        toast.error("Advertencia: Se detectó alteración en la integridad de algunos documentos de la base de datos.");
      }
    } catch (error) {
      console.error("[Supabase] Load Error:", error);
      set({ error: "Error al cargar documentos desde la base de datos central.", isLoading: false });
      toast.error("Error al sincronizar datos con el servidor.");
    }
  },

  // ── Acción: Guardar documentos (Solo usado en modo local fallback) ──
  saveDocuments: (newDocs) => {
    const encryptionKey = getSystemEncryptionKey();
    if (!encryptionKey) {
      toast.error("Clave de sistema no configurada. No se pueden guardar datos.");
      return;
    }

    try {
      const encrypted = encryptData(newDocs, encryptionKey);
      localStorage.setItem(STORAGE_KEY, encrypted);
      set({ documents: newDocs });
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Error al encriptar y guardar los datos.");
    }
  },

  // ── Acción: Registrar un nuevo documento ───────────────────────
  addDocument: async (doc) => {
    const currentDocs = get().documents;
    const encryptionKey = getSystemEncryptionKey();
    if (!encryptionKey) {
      toast.error("Clave de sistema no configurada.");
      return;
    }

    const grupoRegistro = doc.grupoRegistro
      ? doc.grupoRegistro
      : doc.relacionConPF === "Punto Focal"
      ? generateGrupoRegistro()
      : null;

    const docWithDates = {
      ...doc,
      id: crypto.randomUUID(),
      creadoEn: new Date().toISOString(),
      modificadoEn: new Date().toISOString(),
      eliminado: false,
      eliminadoEn: null,
      grupoRegistro,
    };
    docWithDates.checksum = generateChecksum(docWithDates);

    // 1. MODO LOCAL (LocalStorage)
    if (!isSupabaseConfigured()) {
      const newDocs = [docWithDates, ...currentDocs];
      get().saveDocuments(newDocs);
      toast.success("Documento registrado exitosamente (Local)");
      return;
    }

    // 2. MODO COMPARTIDO (Supabase)
    try {
      const encrypted = encryptData(docWithDates, encryptionKey);
      const { error } = await supabase
        .from("documents")
        .insert([
          {
            id: docWithDates.id,
            encrypted_data: encrypted,
            eliminado: false,
            created_at: docWithDates.creadoEn
          }
        ]);

      if (error) throw error;

      set({ documents: [docWithDates, ...currentDocs] });
      toast.success("Documento registrado exitosamente en la nube");
    } catch (error) {
      console.error("[Supabase] Add Error:", error);
      toast.error("Error al guardar en la base de datos central.");
    }
  },

  // ── Acción: Actualizar un documento existente ──────────────────
  updateDocument: async (id, updatedFields) => {
    const currentDocs = get().documents;
    const encryptionKey = getSystemEncryptionKey();
    if (!encryptionKey) {
      toast.error("Clave de sistema no configurada.");
      return;
    }

    const docToUpdate = currentDocs.find(d => d.id === id);
    if (!docToUpdate) return;

    let grupoRegistro = updatedFields.grupoRegistro ?? docToUpdate.grupoRegistro ?? null;
    const relacionConPF = updatedFields.relacionConPF ?? docToUpdate.relacionConPF;

    if (relacionConPF === "Punto Focal" && !grupoRegistro) {
      grupoRegistro = generateGrupoRegistro();
    }

    const updatedDoc = {
      ...docToUpdate,
      ...updatedFields,
      grupoRegistro,
      modificadoEn: new Date().toISOString(),
    };
    updatedDoc.checksum = generateChecksum(updatedDoc);

    // 1. MODO LOCAL (LocalStorage)
    if (!isSupabaseConfigured()) {
      const newDocs = currentDocs.map(d => d.id === id ? updatedDoc : d);
      get().saveDocuments(newDocs);
      toast.success("Documento actualizado exitosamente (Local)");
      return;
    }

    // 2. MODO COMPARTIDO (Supabase)
    try {
      const encrypted = encryptData(updatedDoc, encryptionKey);
      const { error } = await supabase
        .from("documents")
        .update({
          encrypted_data: encrypted,
          updated_at: updatedDoc.modificadoEn
        })
        .eq("id", id);

      if (error) throw error;

      set({ documents: currentDocs.map(d => d.id === id ? updatedDoc : d) });
      toast.success("Documento actualizado exitosamente en la nube");
    } catch (error) {
      console.error("[Supabase] Update Error:", error);
      toast.error("Error al actualizar en la base de datos central.");
    }
  },

  // ── Acción: Eliminar un documento (Físico o Lógico) ───────────
  deleteDocument: async (id, softDelete = true) => {
    const currentDocs = get().documents;
    const encryptionKey = getSystemEncryptionKey();
    if (!encryptionKey) {
      toast.error("Clave de sistema no configurada.");
      return;
    }

    const docToDelete = currentDocs.find(d => d.id === id);
    if (!docToDelete) return;

    // 1. MODO LOCAL (LocalStorage)
    if (!isSupabaseConfigured()) {
      if (softDelete) {
        const updatedDoc = {
          ...docToDelete,
          eliminado: true,
          eliminadoEn: new Date().toISOString(),
          modificadoEn: new Date().toISOString(),
        };
        updatedDoc.checksum = generateChecksum(updatedDoc);
        const newDocs = currentDocs.map(d => d.id === id ? updatedDoc : d);
        get().saveDocuments(newDocs);
        toast.success("Documento enviado a la papelera (Local)");
      } else {
        const newDocs = currentDocs.filter(d => d.id !== id);
        get().saveDocuments(newDocs);
        toast.success("Documento eliminado permanentemente (Local)");
      }
      return;
    }

    // 2. MODO COMPARTIDO (Supabase)
    try {
      if (softDelete) {
        const updatedDoc = {
          ...docToDelete,
          eliminado: true,
          eliminadoEn: new Date().toISOString(),
          modificadoEn: new Date().toISOString(),
        };
        updatedDoc.checksum = generateChecksum(updatedDoc);
        const encrypted = encryptData(updatedDoc, encryptionKey);

        const { error } = await supabase
          .from("documents")
          .update({
            encrypted_data: encrypted,
            eliminado: true,
            updated_at: updatedDoc.modificadoEn
          })
          .eq("id", id);

        if (error) throw error;

        set({ documents: currentDocs.map(d => d.id === id ? updatedDoc : d) });
        toast.success("Documento enviado a la papelera en la nube");
      } else {
        const { error } = await supabase
          .from("documents")
          .delete()
          .eq("id", id);

        if (error) throw error;

        set({ documents: currentDocs.filter(d => d.id !== id) });
        toast.success("Documento eliminado permanentemente de la nube");
      }
    } catch (error) {
      console.error("[Supabase] Delete Error:", error);
      toast.error("Error al eliminar en la base de datos central.");
    }
  },

  // ── Acción: Restaurar documento de la papelera ─────────────────
  restoreDocument: async (id) => {
    const currentDocs = get().documents;
    const encryptionKey = getSystemEncryptionKey();
    if (!encryptionKey) {
      toast.error("Clave de sistema no configurada.");
      return;
    }

    const docToRestore = currentDocs.find(d => d.id === id);
    if (!docToRestore) return;

    const updatedDoc = {
      ...docToRestore,
      eliminado: false,
      eliminadoEn: null,
      modificadoEn: new Date().toISOString(),
    };
    updatedDoc.checksum = generateChecksum(updatedDoc);

    // 1. MODO LOCAL (LocalStorage)
    if (!isSupabaseConfigured()) {
      const newDocs = currentDocs.map(d => d.id === id ? updatedDoc : d);
      get().saveDocuments(newDocs);
      toast.success("Documento restaurado exitosamente (Local)");
      return;
    }

    // 2. MODO COMPARTIDO (Supabase)
    try {
      const encrypted = encryptData(updatedDoc, encryptionKey);
      const { error } = await supabase
        .from("documents")
        .update({
          encrypted_data: encrypted,
          eliminado: false,
          updated_at: updatedDoc.modificadoEn
        })
        .eq("id", id);

      if (error) throw error;

      set({ documents: currentDocs.map(d => d.id === id ? updatedDoc : d) });
      toast.success("Documento restaurado exitosamente en la nube");
    } catch (error) {
      console.error("[Supabase] Restore Error:", error);
      toast.error("Error al restaurar en la base de datos central.");
    }
  },

  // ── Acción: Cargar e importar una copia de seguridad ───────────
  importBackup: async (backupDataStr, currentKey) => {
    try {
      const decrypted = decryptData(backupDataStr, currentKey);
      if (!decrypted || !Array.isArray(decrypted)) {
        return false;
      }

      // 1. MODO LOCAL (LocalStorage)
      if (!isSupabaseConfigured()) {
        get().saveDocuments(decrypted);
        return true;
      }

      // 2. MODO COMPARTIDO (Supabase)
      set({ isLoading: true });
      const rows = decrypted.map(doc => {
        const encrypted = encryptData(doc, currentKey);
        return {
          id: doc.id || crypto.randomUUID(),
          encrypted_data: encrypted,
          eliminado: doc.eliminado || false,
          created_at: doc.creadoEn || new Date().toISOString()
        };
      });

      // Primero limpiamos la base de datos (con una consulta genérica)
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("documents")
        .insert(rows);
      
      if (insertError) throw insertError;

      set({ documents: decrypted, isLoading: false });
      return true;
    } catch (e) {
      console.error("[Supabase] Import Error:", e);
      set({ isLoading: false });
      return false;
    }
  },

  // ── Acción: Restablecer por completo el sistema ─────────────────
  resetSystem: async () => {
    // 1. MODO LOCAL (LocalStorage)
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("dora-auth-hash");
    localStorage.removeItem("dora-auth-salt");

    // 2. MODO COMPARTIDO (Supabase)
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from("documents")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        
        if (error) throw error;
      } catch (err) {
        console.error("[Supabase] Reset Error:", err);
      }
    }

    set({ documents: [] });
  }
}));
