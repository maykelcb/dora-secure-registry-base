import { create } from "zustand";
import { encryptData, decryptData, generateChecksum, verifyChecksum } from "@/utils/crypto";
import { useAuthStore } from "./authStore";
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

  loadDocuments: () => {
    const { encryptionKey } = useAuthStore.getState();
    if (!encryptionKey) return;

    set({ isLoading: true, error: null, integrityWarning: false });
    
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (!encryptedData) {
        set({ documents: [], isLoading: false });
        return;
      }

      const decrypted = decryptData(encryptedData, encryptionKey);
      
      if (!decrypted) {
        set({ error: "Fallo al desencriptar los datos. Contraseña incorrecta o datos corruptos.", isLoading: false });
        return;
      }

      // Verify integrity
      let hasCorruptedData = false;
      const validDocs = decrypted.filter(doc => {
        if (!verifyChecksum(doc)) {
          hasCorruptedData = true;
          return false; // Optional: filter out corrupted docs, or keep them and warn. We'll filter them out for safety, or we could just warn.
          // Let's keep them but flag the warning
        }
        return true;
      });

      // Si queremos ser estrictos y descartar los corruptos, usamos validDocs. 
      // Por ahora, usemos todos pero avisamos
      set({ 
        documents: decrypted, 
        integrityWarning: hasCorruptedData,
        isLoading: false 
      });

      if (hasCorruptedData) {
        toast.error("Advertencia: Se detectó alteración en la integridad de algunos documentos.");
      }

    } catch (error) {
      console.error(error);
      set({ error: "Error crítico al cargar datos.", isLoading: false });
    }
  },

  saveDocuments: (newDocs) => {
    const { encryptionKey } = useAuthStore.getState();
    if (!encryptionKey) {
      toast.error("Sesión no válida. No se pueden guardar datos.");
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

  addDocument: (doc) => {
    const currentDocs = get().documents;
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
    
    const newDocs = [docWithDates, ...currentDocs];
    get().saveDocuments(newDocs);
    toast.success("Documento registrado exitosamente");
  },

  updateDocument: (id, updatedFields) => {
    const currentDocs = get().documents;
    const newDocs = currentDocs.map(doc => {
      if (doc.id === id) {
        let grupoRegistro = updatedFields.grupoRegistro ?? doc.grupoRegistro ?? null;
        const relacionConPF = updatedFields.relacionConPF ?? doc.relacionConPF;

        if (relacionConPF === "Punto Focal" && !grupoRegistro) {
          grupoRegistro = generateGrupoRegistro();
        }

        const updatedDoc = {
          ...doc,
          ...updatedFields,
          grupoRegistro,
          modificadoEn: new Date().toISOString(),
        };
        updatedDoc.checksum = generateChecksum(updatedDoc);
        return updatedDoc;
      }
      return doc;
    });
    get().saveDocuments(newDocs);
    toast.success("Documento actualizado exitosamente");
  },

  deleteDocument: (id, softDelete = true) => {
    const currentDocs = get().documents;
    
    if (softDelete) {
      const newDocs = currentDocs.map(doc => {
        if (doc.id === id) {
          const updatedDoc = {
            ...doc,
            eliminado: true,
            eliminadoEn: new Date().toISOString(),
            modificadoEn: new Date().toISOString(),
          };
          updatedDoc.checksum = generateChecksum(updatedDoc);
          return updatedDoc;
        }
        return doc;
      });
      get().saveDocuments(newDocs);
      toast.success("Documento enviado a la papelera");
    } else {
      const newDocs = currentDocs.filter(doc => doc.id !== id);
      get().saveDocuments(newDocs);
      toast.success("Documento eliminado permanentemente");
    }
  },

  restoreDocument: (id) => {
    const currentDocs = get().documents;
    const newDocs = currentDocs.map(doc => {
      if (doc.id === id) {
        const updatedDoc = {
          ...doc,
          eliminado: false,
          eliminadoEn: null,
          modificadoEn: new Date().toISOString(),
        };
        updatedDoc.checksum = generateChecksum(updatedDoc);
        return updatedDoc;
      }
      return doc;
    });
    get().saveDocuments(newDocs);
    toast.success("Documento restaurado exitosamente");
  },

  // Re-encripta todos los documentos con una nueva clave (cuando cambia la contraseña maestra)
  reEncryptAllData: (newKey) => {
    const currentDocs = get().documents;
    try {
      const encrypted = encryptData(currentDocs, newKey);
      localStorage.setItem(STORAGE_KEY, encrypted);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  
  // Carga e importa backup
  importBackup: (backupDataStr, currentKey) => {
    try {
      const decrypted = decryptData(backupDataStr, currentKey);
      if (decrypted && Array.isArray(decrypted)) {
        get().saveDocuments(decrypted);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },
  
  // Limpia absolutamente todo
  resetSystem: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("dora-auth-hash");
    localStorage.removeItem("dora-auth-salt");
    set({ documents: [] });
  }
}));
