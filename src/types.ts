export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'file';
  tooltip: string;
  options?: string[];
  required: boolean;
  validation?: {
    pattern?: RegExp;
    message?: string;
  };
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface FormData {
  [key: string]: string | File;
}

export interface ApplicationStatus {
  id: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  lastUpdated: string;
  comments?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export type ValidationErrors = {
  [key: string]: string;
}