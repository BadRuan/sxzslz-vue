import { ref } from 'vue';
import { defineStore } from 'pinia';
import apiService from '@/utils/apiService';
import { url_prefix } from '@/utils/baseInfo';


export interface DocumentModel {
    id: number,
    name: string,
    slug: string,
    raw_filename: string,
    uploaded_at: string,
    view: number
}

class DocumentService{
    public getDcumentArray() {
        return apiService.get(url_prefix.document_prefix)
    }
}

const documentService = new DocumentService();

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<DocumentModel[]>([])
  const loading = ref(false)

  const fetchCategories = async () => {
    loading.value = true
    try {
      const res = await documentService.getDcumentArray()
      documents.value = res.items
    } catch (error) {
      console.error('获取文件列表失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  const checkDocument = async () => {
    if (documents.value.length == 0){
      await fetchCategories();
    }
  }

  return { documents, checkDocument, loading }
})
