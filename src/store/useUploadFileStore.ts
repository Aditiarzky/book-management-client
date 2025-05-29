import { create, type StoreApi, type UseBoundStore } from 'zustand';
import getErrorMessage from '../utils/error';
import { uploadImageToCloudinary } from '../utils/api';
import type { IUpFileStore } from '@/types/core.types';

const useUpFile: UseBoundStore<StoreApi<IUpFileStore>> = create((set) => ({
  loading: false,
  onProgress: 0,
  uploadFile: async (file: File, onUploadProgress?: (progress: number) => void): Promise<string | null> => {
    try {
      set({ loading: true, onProgress: 0 });

      const imageUrl = await uploadImageToCloudinary(file, (progress) => {
        set({ onProgress: progress });
        if (onUploadProgress) onUploadProgress(progress);
      });

      return imageUrl;
    } catch (error) {
      const message = getErrorMessage(error);
      alert(`Gagal mengunggah gambar! \nError: ${message}`);
      const manualUrl = prompt('Masukkan URL gambar secara manual:');
      return manualUrl || null;
    } finally {
      set({ loading: false });
    }
  },
  uploadFileMultiple: async (file: File, onUploadProgress?: (progress: number) => void): Promise<string | null> => {
    try {
      set({ loading: true, onProgress: 0 });

      const response = await uploadImageToCloudinary(file, (progress) => {
        set({ onProgress: progress });
        if (onUploadProgress) onUploadProgress(progress);
      });

      set({ onProgress: 100 });
      return response;
    } catch (error) {
      const message = getErrorMessage(error);
      alert(`Gagal mengunggah gambar! \nError: ${message}`);
      const manualUrl = prompt('Masukkan URL gambar secara manual:');
      return manualUrl || null;
    } finally {
      set({ loading: false });
    }
  },
}));

export default useUpFile;
