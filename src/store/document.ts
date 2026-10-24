import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';

/** 文件列表项，字段与 GET /document/ 一致（同图片列表） */
export interface DocumentModel {
    id: number,
    slug: string,
    raw_filename: string,
    mime_type: string,
    size_bytes: number,
    view: number,
    uploaded_at: string
}

class DocumentService{
    public getDocumentArray() {
        return apiService.get('/document/')
    }
}

const documentService = new DocumentService();

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<DocumentModel[]>([])
  const loading = ref(false)

  const fetchDocuments = async () => {
    loading.value = true
    try {
      const res = await documentService.getDocumentArray()
      documents.value = res.data ?? []
    } catch (error) {
      console.error('获取文件列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const checkDocument = async () => {
    if (documents.value.length == 0){
      await fetchDocuments();
    }
  }

  return { documents, checkDocument, loading }
})
